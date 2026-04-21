export const TOOL_DEFINITIONS = [
  {
    name: "analyze_requirements",
    description:
      "Extract intents, bullet features, and rough complexity from raw PRD text.",
    parameters: {
      type: "object",
      properties: {
        requirements: { type: "string", description: "Full PRD or user prompt" }
      },
      required: ["requirements"]
    }
  },
  {
    name: "build_ui_from_prd",
    description:
      "Generate app metadata, Tailwind component tree, and React export code from PRD.",
    parameters: {
      type: "object",
      properties: {
        requirements: { type: "string" },
        analysisSummary: { type: "string", description: "Short analyst notes for context" }
      },
      required: ["requirements"]
    }
  },
  {
    name: "validate_component_tree",
    description: "Check tree depth/size and flag structural issues.",
    parameters: {
      type: "object",
      properties: {
        appName: { type: "string" },
        treeJson: { type: "string", description: "JSON stringified component root" }
      },
      required: ["treeJson"]
    }
  }
] as const;

export type ToolName = (typeof TOOL_DEFINITIONS)[number]["name"];
