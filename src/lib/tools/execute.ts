import { generateFromPRD } from "@/lib/ai";
import type { UIComponentNode } from "@/lib/types";
import type { AnalysisResult, ValidationResult } from "@/lib/orchestration/types";
import type { ToolName } from "@/lib/tools/definitions";

function extractBullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("-") || l.startsWith("*"))
    .map((l) => l.replace(/^[-*]\s*/, ""));
}

function guessIntents(text: string): string[] {
  const intents: string[] = [];
  if (/login|sign in|auth/i.test(text)) intents.push("authentication");
  if (/task|todo/i.test(text)) intents.push("task-management");
  if (/dashboard|analytics/i.test(text)) intents.push("dashboard");
  if (/button|cta/i.test(text)) intents.push("component");
  if (/filter|search/i.test(text)) intents.push("filtering");
  if (intents.length === 0) intents.push("general-ui");
  return intents;
}

function complexityFrom(text: string, bullets: number): "low" | "medium" | "high" {
  const len = text.length;
  if (bullets >= 6 || len > 800) return "high";
  if (bullets >= 3 || len > 300) return "medium";
  return "low";
}

export function toolAnalyzeRequirements(requirements: string): AnalysisResult {
  const featureBullets = extractBullets(requirements);
  const intents = guessIntents(requirements);
  const suggestedComplexity = complexityFrom(requirements, featureBullets.length);
  return {
    intents,
    featureBullets,
    suggestedComplexity,
    notes: `Detected ${intents.join(", ")}; ${featureBullets.length} bullet features.`
  };
}

export async function toolBuildUiFromPrd(requirements: string, _analysisSummary: string) {
  return generateFromPRD(requirements);
}

function countNodes(node: UIComponentNode): { count: number; depth: number } {
  const children = node.children ?? [];
  if (children.length === 0) return { count: 1, depth: 1 };
  let maxChildDepth = 0;
  let sum = 1;
  for (const c of children) {
    const sub = countNodes(c);
    sum += sub.count;
    maxChildDepth = Math.max(maxChildDepth, sub.depth);
  }
  return { count: sum, depth: 1 + maxChildDepth };
}

export function toolValidateComponentTree(tree: UIComponentNode, appName?: string): ValidationResult {
  const { count, depth } = countNodes(tree);
  const issues: string[] = [];
  if (count < 2) issues.push("Tree is very small; consider richer hierarchy.");
  if (depth > 12) issues.push("Tree depth is high; consider flattening sections.");
  if (!appName?.trim()) issues.push("Missing app name metadata.");
  return {
    ok: issues.length === 0,
    nodeCount: count,
    maxDepth: depth,
    issues
  };
}

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>
): Promise<{ summary: string; payload?: unknown }> {
  switch (name) {
    case "analyze_requirements": {
      const requirements = String(args.requirements ?? "");
      const analysis = toolAnalyzeRequirements(requirements);
      return {
        summary: `${analysis.notes} Complexity: ${analysis.suggestedComplexity}.`,
        payload: analysis
      };
    }
    case "build_ui_from_prd": {
      const requirements = String(args.requirements ?? "");
      const analysisSummary = String(args.analysisSummary ?? "");
      const ui = await toolBuildUiFromPrd(requirements, analysisSummary);
      return {
        summary: `Built UI "${ui.appName}" with ${JSON.stringify(ui.description).slice(0, 120)}…`,
        payload: ui
      };
    }
    case "validate_component_tree": {
      const treeJson = String(args.treeJson ?? "{}");
      const appName = args.appName ? String(args.appName) : undefined;
      const tree = JSON.parse(treeJson) as UIComponentNode;
      const v = toolValidateComponentTree(tree, appName);
      return {
        summary: v.ok
          ? `Validation OK: ${v.nodeCount} nodes, depth ${v.maxDepth}.`
          : `Validation issues: ${v.issues.join("; ")}`,
        payload: v
      };
    }
    default:
      return { summary: "Unknown tool" };
  }
}
