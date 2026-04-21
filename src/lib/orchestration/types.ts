import type { UIGenerationResult } from "@/lib/types";

export type MemoryEntry = {
  id: string;
  role: "system" | "analyst" | "builder" | "reviewer" | "tool";
  content: string;
  createdAt: number;
};

export type ToolCallRecord = {
  id: string;
  agent: "RequirementsAnalyst" | "UIBuilder" | "UIReviewer";
  toolName: string;
  args: Record<string, unknown>;
  resultSummary: string;
  createdAt: number;
};

export type AgentStep = {
  agent: ToolCallRecord["agent"];
  phase: "plan" | "act" | "reflect";
  message: string;
  createdAt: number;
};

export type OrchestrationPayload = {
  sessionId: string;
  memory: MemoryEntry[];
  toolCalls: ToolCallRecord[];
  agentSteps: AgentStep[];
};

export type OrchestrationResponse = UIGenerationResult & {
  orchestration: OrchestrationPayload;
};

export type AnalysisResult = {
  intents: string[];
  featureBullets: string[];
  suggestedComplexity: "low" | "medium" | "high";
  notes: string;
};

export type ValidationResult = {
  ok: boolean;
  nodeCount: number;
  maxDepth: number;
  issues: string[];
};
