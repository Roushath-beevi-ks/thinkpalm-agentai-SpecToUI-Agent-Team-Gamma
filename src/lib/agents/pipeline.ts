import {
  appendMemory,
  getSessionMemory,
  memoryContextForAgents
} from "@/lib/memory/session-memory";
import type {
  AgentStep,
  AnalysisResult,
  MemoryEntry,
  OrchestrationPayload,
  OrchestrationResponse,
  ToolCallRecord
} from "@/lib/orchestration/types";
import { applyPreviewAlignedExport } from "@/lib/preview-aligned-export";
import type { UIGenerationResult } from "@/lib/types";
import { executeTool } from "@/lib/tools/execute";
import type { ToolName } from "@/lib/tools/definitions";

function now(): number {
  return Date.now();
}

function id(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function recordToolCall(
  agent: ToolCallRecord["agent"],
  toolName: string,
  args: Record<string, unknown>,
  resultSummary: string,
  toolCalls: ToolCallRecord[]
): ToolCallRecord {
  const rec: ToolCallRecord = {
    id: id(),
    agent,
    toolName,
    args,
    resultSummary,
    createdAt: now()
  };
  toolCalls.push(rec);
  return rec;
}

export async function runOrchestration(
  sessionId: string,
  requirements: string
): Promise<OrchestrationResponse> {
  const toolCalls: ToolCallRecord[] = [];
  const agentSteps: AgentStep[] = [];

  appendMemory(sessionId, {
    role: "system",
    content: `New PRD received (${requirements.length} chars). Session ${sessionId}.`
  });

  agentSteps.push({
    agent: "RequirementsAnalyst",
    phase: "plan",
    message:
      "Planning: call analyze_requirements to structure intents and features before UI synthesis.",
    createdAt: now()
  });

  const analysisExec = await executeTool("analyze_requirements" as ToolName, {
    requirements
  });
  const analysis = analysisExec.payload as AnalysisResult;
  appendMemory(sessionId, {
    role: "analyst",
    content: `Analysis: ${analysis.notes} Intents: ${analysis.intents.join(", ")}.`
  });
  appendMemory(sessionId, {
    role: "tool",
    content: `[analyze_requirements] ${analysisExec.summary}`
  });
  recordToolCall(
    "RequirementsAnalyst",
    "analyze_requirements",
    { requirements: `${requirements.slice(0, 200)}${requirements.length > 200 ? "…" : ""}` },
    analysisExec.summary,
    toolCalls
  );

  const ctx = memoryContextForAgents(sessionId, 8);
  const analysisSummary = `Intents: ${analysis.intents.join(", ")}. Complexity: ${analysis.suggestedComplexity}. Context:\n${ctx}`;

  agentSteps.push({
    agent: "UIBuilder",
    phase: "act",
    message:
      "Using shared memory context; invoking build_ui_from_prd to produce Tailwind component tree and export code.",
    createdAt: now()
  });

  const buildExec = await executeTool("build_ui_from_prd" as ToolName, {
    requirements,
    analysisSummary
  });
  const ui = applyPreviewAlignedExport(
    requirements,
    buildExec.payload as UIGenerationResult
  );
  appendMemory(sessionId, {
    role: "builder",
    content: `Generated app "${ui.appName}": ${ui.description.slice(0, 240)}`
  });
  appendMemory(sessionId, {
    role: "tool",
    content: `[build_ui_from_prd] ${buildExec.summary}`
  });
  recordToolCall(
    "UIBuilder",
    "build_ui_from_prd",
    { requirements: "(full PRD)", analysisSummary: analysisSummary.slice(0, 300) },
    buildExec.summary,
    toolCalls
  );

  agentSteps.push({
    agent: "UIReviewer",
    phase: "reflect",
    message:
      "Running validate_component_tree on the synthesized tree for depth/size checks.",
    createdAt: now()
  });

  const validateExec = await executeTool("validate_component_tree" as ToolName, {
    appName: ui.appName,
    treeJson: JSON.stringify(ui.componentTree)
  });
  appendMemory(sessionId, {
    role: "reviewer",
    content: `Review: ${validateExec.summary}`
  });
  appendMemory(sessionId, {
    role: "tool",
    content: `[validate_component_tree] ${validateExec.summary}`
  });
  recordToolCall(
    "UIReviewer",
    "validate_component_tree",
    { appName: ui.appName, treeJson: "(componentTree)" },
    validateExec.summary,
    toolCalls
  );

  const memory: MemoryEntry[] = [...getSessionMemory(sessionId)];
  const orchestration: OrchestrationPayload = {
    sessionId,
    memory,
    toolCalls,
    agentSteps
  };

  return {
    ...ui,
    orchestration
  };
}
