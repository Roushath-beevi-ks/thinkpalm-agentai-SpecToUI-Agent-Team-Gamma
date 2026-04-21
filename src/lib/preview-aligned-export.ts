import { readFileSync } from "node:fs";
import path from "node:path";
import { isAnalyticsDashboardSaaSIntent } from "@/lib/analytics-dashboard-intent";
import { parseEmployeeMetricChartIntent } from "@/lib/chart-intent";
import type { UIGenerationResult } from "@/lib/types";

const MARKER = "SpecToUI Agent — this export matches the Live UI preview";

function readSrc(rel: string): string {
  return readFileSync(path.join(process.cwd(), "src", rel), "utf8");
}

function isTaskManagementIntent(text: string): boolean {
  return /task|todo|taskflow|task flow|task management|checklist/i.test(text);
}

const HEADER = `/**
 * ${MARKER} in the app.
 * Save each section into a file named in the \`// -----\` header (same folder).
 * Dependencies: \`react\`, \`recharts\` where charts are used.
 */

`;

function section(filename: string, body: string): string {
  return `// ----- ${filename} -----\n${body.trimEnd()}\n\n`;
}

function bundleInsight(): string {
  const meta = readSrc("lib/prd-metadata.ts");
  let preview = readSrc("components/insight-board-preview.tsx");
  preview = preview.replace(/from ["']@\/lib\/prd-metadata["']/g, 'from "./prd-metadata"');
  return HEADER + section("prd-metadata.ts", meta) + section("insight-board-preview.tsx", preview);
}

function bundleTask(): string {
  const meta = readSrc("lib/prd-metadata.ts");
  const icons = readSrc("components/task-action-icons.tsx");
  let task = readSrc("components/task-flow-interactive-preview.tsx");
  task = task.replace(/from ["']@\/lib\/prd-metadata["']/g, 'from "./prd-metadata"');
  task = task.replace(/from ["']@\/components\/task-action-icons["']/g, 'from "./task-action-icons"');
  return (
    HEADER +
    section("prd-metadata.ts", meta) +
    section("task-action-icons.tsx", icons) +
    section("task-flow-interactive-preview.tsx", task)
  );
}

function bundleChart(): string {
  const chartIntent = readSrc("lib/chart-intent.ts");
  let chart = readSrc("components/stress-employees-chart.tsx");
  chart = chart.replace(/from ["']@\/lib\/chart-intent["']/g, 'from "./chart-intent"');
  return HEADER + section("chart-intent.ts", chartIntent) + section("stress-employees-chart.tsx", chart);
}

/**
 * When the Live preview uses a built-in demo, return that demo’s source files (bundled).
 * Priority matches {@link src/app/page.tsx} preview branch order.
 */
export function getPreviewAlignedExport(requirements: string): string | null {
  try {
    const chartKind = parseEmployeeMetricChartIntent(requirements);
    if (chartKind) return bundleChart();
    if (isAnalyticsDashboardSaaSIntent(requirements)) return bundleInsight();
    if (isTaskManagementIntent(requirements)) return bundleTask();
  } catch {
    return null;
  }
  return null;
}

export function applyPreviewAlignedExport(
  requirements: string,
  ui: UIGenerationResult
): UIGenerationResult {
  const aligned = getPreviewAlignedExport(requirements);
  if (!aligned) return ui;
  return { ...ui, generatedCode: aligned };
}
