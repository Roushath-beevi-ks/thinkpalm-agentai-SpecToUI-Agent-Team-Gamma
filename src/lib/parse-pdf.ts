import pdf2json from "pdf2json";
import type { Output, Page, Text } from "pdf2json";

const PDFParser = pdf2json as unknown as typeof import("pdf2json").PDFParser;

/** pdf2json stores runs URI-encoded; decode safely */
function decodeRuns(runs: Text["R"]): string {
  if (!runs?.length) return "";
  return runs
    .map((run) => {
      const raw = run.T ?? "";
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    })
    .join("");
}

/**
 * Merge horizontal fragments on the same line, then order lines top → bottom.
 * PDF "raw" order often differs from reading order; position sort fixes most PRDs.
 */
const SAME_LINE_EPS = 4;

function pageToReadingOrderText(page: Page): string {
  type Frag = { y: number; x: number; text: string };
  const frags: Frag[] = [];

  for (const block of page.Texts ?? []) {
    const text = decodeRuns(block.R).replace(/\s+/g, " ").trim();
    if (!text) continue;
    frags.push({ y: block.y, x: block.x, text });
  }

  if (frags.length === 0) return "";

  frags.sort((a, b) => {
    if (Math.abs(a.y - b.y) <= SAME_LINE_EPS) return a.x - b.x;
    return a.y - b.y;
  });

  const lines: string[] = [];
  let lineBuf: string[] = [];
  let lineY: number | null = null;

  for (const f of frags) {
    if (lineY === null) {
      lineY = f.y;
      lineBuf.push(f.text);
      continue;
    }
    if (Math.abs(f.y - lineY) <= SAME_LINE_EPS) {
      lineBuf.push(f.text);
    } else {
      lines.push(lineBuf.join(" ").trim());
      lineBuf = [f.text];
      lineY = f.y;
    }
  }
  if (lineBuf.length) lines.push(lineBuf.join(" ").trim());

  const cleaned = lines.map((l) => l.trim()).filter(Boolean);
  const fixed = fixReversedPageLines(cleaned);
  return fixed.join("\n");
}

/**
 * Some PDFs use a Y axis where our top→bottom sort still yields reversed reading order
 * (e.g. list item 6 appears before 1, or "Core Features" before "Product Name").
 */
function fixReversedPageLines(lines: string[]): string[] {
  if (lines.length < 3) return lines;
  const t = lines.join("\n");
  const idx = (s: string) => {
    const i = t.indexOf(s);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };

  const numberedBackwards =
    /\b1\.\s/.test(t) &&
    /\b6\.\s/.test(t) &&
    t.search(/\b6\.\s/) < t.search(/\b1\.\s/);

  const headingsBackwards =
    t.includes("Product Name") &&
    t.includes("Core Features") &&
    idx("Core Features") < idx("Product Name");

  /** Typical PRD has Product Name before Overview; extraction often flips the whole page. */
  const productAfterOverview =
    t.includes("Product Name") &&
    t.includes("Overview") &&
    idx("Product Name") > idx("Overview");

  if (numberedBackwards || headingsBackwards || productAfterOverview) {
    return [...lines].reverse();
  }
  return lines;
}

export function extractOrderedTextFromPdfOutput(data: Output): string {
  const parts = (data.Pages ?? []).map(pageToReadingOrderText).filter(Boolean);
  return parts
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract plain text from a PDF buffer (Node-safe, no pdf.js workers).
 * Uses geometry-aware ordering instead of getRawTextContent() (often reversed/jumbled).
 */
export function extractTextFromPdfBuffer(buf: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, true);

    parser.on("pdfParser_dataError", (errMsg) => {
      const err =
        errMsg && typeof errMsg === "object" && "parserError" in errMsg
          ? (errMsg as { parserError: Error }).parserError
          : errMsg;
      parser.destroy();
      reject(err instanceof Error ? err : new Error(String(err)));
    });

    parser.on("pdfParser_dataReady", (pdfData: Output) => {
      try {
        const text = extractOrderedTextFromPdfOutput(pdfData);
        resolve(text);
      } catch (e) {
        reject(e);
      } finally {
        parser.destroy();
      }
    });

    parser.parseBuffer(buf);
  });
}
