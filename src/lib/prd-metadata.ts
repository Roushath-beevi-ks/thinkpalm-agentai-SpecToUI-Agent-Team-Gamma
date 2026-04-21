/**
 * Parse common PRD patterns so UI titles and task seeds match the document,
 * not the first line / random bullets (UI/UX, States, etc.).
 */

/** Short product name only, e.g. "MyApp" from "Product Name: MyApp" */
export function extractProductName(prd: string): string {
  const m = prd.match(/Product\s*Name\s*:\s*([^\n\r]+)/i);
  if (!m) return "";
  const raw = m[1].trim();
  // First token is usually the name; avoid slurping "Overview" or sentences
  const token = raw.split(/[\s,;|]+/)[0]?.trim() ?? raw;
  const cleaned = token.replace(/[^\w.-]/g, "");
  if (cleaned.length >= 2 && cleaned.length <= 48) return cleaned;
  return raw.split(/\s+/).slice(0, 2).join(" ").trim() || "App";
}

/** Subtitle: prefer section label "Overview", not the full paragraph */
export function extractHeaderSubtitle(prd: string): string {
  if (/overview\s*:/i.test(prd)) return "Overview";
  const overview = extractOverviewOneLiner(prd);
  return overview ? overview.slice(0, 90) + (overview.length > 90 ? "…" : "") : "Task management";
}

export function extractOverviewOneLiner(prd: string): string {
  const m = prd.match(/Overview\s*:\s*([\s\S]*?)(?=\n\s*Core\s*Features|\n\s*UI\/UX|$)/i);
  if (!m) return "";
  return m[1].replace(/\s+/g, " ").trim();
}

/**
 * Numbered lines under "Core Features" only (stops at UI/UX, States, etc.).
 */
export function extractCoreFeatureLines(prd: string): string[] {
  const parts = prd.split(/core\s*features\s*:/i);
  if (parts.length < 2) return [];
  let chunk = parts[1] ?? "";
  const stop = chunk.search(/\n\s*(UI\/UX|States?\s*:|State\s*:|Technical|$)/i);
  if (stop >= 0) chunk = chunk.slice(0, stop);

  const items: string[] = [];
  for (const line of chunk.split("\n")) {
    const m = line.match(/^\s*(\d+)\.\s*(.+)$/);
    if (m) {
      let text = m[2].trim().replace(/\s*[–—]\s*/g, " – ");
      items.push(text);
    }
  }
  return items;
}

export function extractDisplayHeader(prd: string): { title: string; subtitle: string } {
  const title = extractProductName(prd) || "App";
  const subtitle = extractHeaderSubtitle(prd);
  return { title, subtitle };
}
