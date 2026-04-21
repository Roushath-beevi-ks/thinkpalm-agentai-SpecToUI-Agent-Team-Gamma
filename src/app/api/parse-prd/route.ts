import { NextResponse } from "next/server";
import { extractTextFromPdfBuffer } from "@/lib/parse-pdf";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file field \"file\"" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 5 MB)" },
        { status: 400 }
      );
    }

    const name = file.name || "document";
    const ext = extOf(name);
    const buf = Buffer.from(await file.arrayBuffer());

    if (ext === ".txt" || ext === ".md" || file.type.startsWith("text/")) {
      return NextResponse.json({
        text: buf.toString("utf8"),
        fileName: name
      });
    }

    if (ext === ".docx" || file.type.includes("wordprocessingml")) {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return NextResponse.json({
        text: (value || "").trim(),
        fileName: name
      });
    }

    if (ext === ".pdf" || file.type === "application/pdf") {
      const raw = await extractTextFromPdfBuffer(buf);
      return NextResponse.json({
        text: raw.trim(),
        fileName: name
      });
    }

    return NextResponse.json(
      {
        error: "Unsupported format. Upload .txt, .md, .docx, or .pdf"
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to parse document" },
      { status: 500 }
    );
  }
}
