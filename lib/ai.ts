import { UIComponentNode, UIGenerationResult } from "@/lib/types";

const systemPrompt = `
You are a senior React/Tailwind UI architect.
Generate a strict JSON object only, no markdown.
The JSON must match this exact schema:
{
  "appName": "string",
  "description": "string",
  "componentTree": {
    "name": "string",
    "purpose": "string",
    "tailwindClasses": "string",
    "props": {},
    "children": []
  }
}
Rules:
- Output valid JSON only.
- Build a complete, realistic UI hierarchy from the PRD.
- Use semantic component names (DashboardPage, Header, Sidebar, etc.).
- Add practical Tailwind classes for spacing, layout, typography, color and states.
- Ensure tree is renderable and nested correctly.
`;

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toPageName(prdText: string): string {
  const firstLine = prdText.split("\n").find((line) => line.trim().length > 0) ?? "";
  const cleanFirstLine = firstLine
    .replace(/^build\s+/i, "")
    .replace(/^create\s+/i, "")
    .replace(/^design\s+/i, "");
  const title = toTitleCase(cleanFirstLine).replace(/\s+/g, "");
  return title ? `${title}Page` : "GeneratedAppPage";
}

function toDisplayTitleFromPageName(pageName: string): string {
  return pageName
    .replace(/Page$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
}

function extractFeatureLines(prdText: string): string[] {
  return prdText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => line.startsWith("-") || line.startsWith("*"))
    .map((line) => line.replace(/^[-*]\s*/, ""));
}

function buildRuleBasedFallbackTree(prdText: string): UIComponentNode {
  const features = extractFeatureLines(prdText);
  const displayFeatures =
    features.length > 0
      ? features.slice(0, 6)
      : ["Define key workflows", "Add main actions", "Create responsive layout"];

  const hasFilter = displayFeatures.some((line) => /filter|search|sort/i.test(line));
  const hasCreate = displayFeatures.some((line) => /add|create|new/i.test(line));
  const isLoginIntent = /login|log in|sign in|signin|authentication|auth/i.test(prdText);
  const isButtonIntent = /button|cta|call to action/i.test(prdText);
  const isPageIntent = /page|screen|dashboard|app|layout/i.test(prdText);
  const pageName = toPageName(prdText);
  const appTitle = toDisplayTitleFromPageName(pageName) || "Generated App";

  if (isButtonIntent && !isPageIntent && !isLoginIntent) {
    return {
      name: "ButtonComponent",
      purpose: "Reusable button component",
      tailwindClasses: "p-4 bg-slate-50 rounded-lg",
      children: [
        {
          name: "PrimaryButton",
          purpose: "Main call-to-action button",
          tailwindClasses:
            "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
          props: { text: "Click Me" }
        }
      ]
    };
  }

  if (isLoginIntent) {
    return {
      name: "LoginPage",
      purpose: "Authentication screen for user sign in",
      tailwindClasses:
        "min-h-screen bg-slate-100 flex items-center justify-center p-6",
      children: [
        {
          name: "LoginCard",
          purpose: "Centered login form container",
          tailwindClasses:
            "w-full max-w-md rounded-xl bg-white p-6 shadow-lg border border-slate-200",
          children: [
            {
              name: "Header",
              purpose: "Login page heading",
              tailwindClasses: "mb-6 text-center",
              children: [
                {
                  name: "Title",
                  purpose: "Primary heading",
                  tailwindClasses: "text-2xl font-bold text-slate-900",
                  props: { text: "Login" }
                },
                {
                  name: "Subtitle",
                  purpose: "Secondary heading text",
                  tailwindClasses: "mt-1 text-sm text-slate-500",
                  props: { text: "Sign in to continue to your account." }
                }
              ]
            },
            {
              name: "LoginForm",
              purpose: "User credentials form",
              tailwindClasses: "space-y-4",
              children: [
                {
                  name: "EmailInput",
                  purpose: "User email input",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Email address" }
                },
                {
                  name: "PasswordInput",
                  purpose: "User password input",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Password" }
                },
                {
                  name: "LoginButton",
                  purpose: "Submit sign-in form",
                  tailwindClasses:
                    "w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
                  props: { text: "Sign In" }
                },
                {
                  name: "HelperLinks",
                  purpose: "Password reset and sign up actions",
                  tailwindClasses: "flex justify-between text-xs text-blue-600",
                  children: [
                    {
                      name: "ForgotPasswordLink",
                      purpose: "Recovery action",
                      tailwindClasses: "hover:underline",
                      props: { text: "Forgot password?" }
                    },
                    {
                      name: "SignUpLink",
                      purpose: "Create account action",
                      tailwindClasses: "hover:underline",
                      props: { text: "Create account" }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  }

  return {
    name: pageName,
    purpose: "Main generated page based on provided requirements",
    tailwindClasses: "min-h-screen bg-slate-100 p-8",
    children: [
      {
        name: "Container",
        purpose: "Centers and constrains content width",
        tailwindClasses: "mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-lg",
        children: [
          {
            name: "Header",
            purpose: "Page heading and context",
            tailwindClasses: "mb-6 border-b border-slate-200 pb-4",
            children: [
              {
                name: "Title",
                purpose: "Primary heading",
                tailwindClasses: "text-2xl font-bold text-slate-900",
                props: { text: appTitle }
              },
              {
                name: "Subtitle",
                purpose: "Fallback mode explanation",
                tailwindClasses: "mt-1 text-sm text-slate-500",
                props: {
                  text: "Rule-based preview generated without OpenAI API key."
                }
              }
            ]
          },
          ...(hasCreate
            ? [
                {
                  name: "Controls",
                  purpose: "Input and action row",
                  tailwindClasses: "mb-4 flex gap-3",
                  children: [
                    {
                      name: "PrimaryInput",
                      purpose: "Primary create input",
                      tailwindClasses:
                        "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                      props: { placeholder: "Add item..." }
                    },
                    {
                      name: "PrimaryButton",
                      purpose: "Primary submit action",
                      tailwindClasses:
                        "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
                      props: { text: "Add" }
                    }
                  ]
                } as UIComponentNode
              ]
            : []),
          ...(hasFilter
            ? [
                {
                  name: "FilterBar",
                  purpose: "Quick filtering controls",
                  tailwindClasses: "mb-4 flex gap-2",
                  children: [
                    {
                      name: "FilterChip",
                      purpose: "Filter option",
                      tailwindClasses:
                        "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700",
                      props: { text: "All" }
                    },
                    {
                      name: "FilterChip",
                      purpose: "Filter option",
                      tailwindClasses:
                        "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700",
                      props: { text: "Filtered" }
                    }
                  ]
                } as UIComponentNode
              ]
            : []),
          {
            name: "FeatureList",
            purpose: "Visualized requirements list",
            tailwindClasses: "space-y-2",
            children: displayFeatures.map((feature) => ({
              name: "FeatureItem",
              purpose: "Single requirement row",
              tailwindClasses:
                "rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700",
              props: { text: feature }
            }))
          }
        ]
      }
    ]
  };
}

function nodeToJsx(node: UIComponentNode, depth = 2): string {
  const indent = "  ".repeat(depth);
  const textValue =
    typeof node.props?.text === "string" ? String(node.props.text) : node.name;
  const classes = node.tailwindClasses || "";
  const children = node.children ?? [];

  if (children.length === 0) {
    if (/button/i.test(node.name)) {
      return `${indent}<button className="${classes}">${textValue}</button>`;
    }
    if (/input/i.test(node.name)) {
      const placeholder =
        typeof node.props?.placeholder === "string"
          ? String(node.props.placeholder)
          : "Enter value";
      return `${indent}<input className="${classes}" placeholder="${placeholder}" />`;
    }
    return `${indent}<div className="${classes}">${textValue}</div>`;
  }

  const childJsx = children.map((child) => nodeToJsx(child, depth + 1)).join("\n");
  return `${indent}<div className="${classes}">\n${childJsx}\n${indent}</div>`;
}

export function buildReactCode(tree: UIComponentNode): string {
  return [
    "export default function GeneratedUI() {",
    "  return (",
    nodeToJsx(tree),
    "  );",
    "}"
  ].join("\n");
}

export function buildUserPrompt(prdText: string): string {
  return `
Product requirements document:
${prdText}

Return the JSON only.
`;
}

function buildFallbackResult(prdText: string, reason: string): UIGenerationResult {
  const fallbackTree = buildRuleBasedFallbackTree(prdText);
  const pageName = toPageName(prdText);
  return {
    appName: toDisplayTitleFromPageName(pageName) || "AI UI Builder",
    description: `Dynamic fallback output (${reason}): generated from requirements using local rules.`,
    componentTree: fallbackTree,
    generatedCode: buildReactCode(fallbackTree)
  };
}

export async function generateFromPRD(prdText: string): Promise<UIGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildFallbackResult(prdText, "no OPENAI_API_KEY configured");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildUserPrompt(prdText) }
        ]
      })
    });

    if (!response.ok) {
      return buildFallbackResult(prdText, `AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return buildFallbackResult(prdText, "AI returned empty response");
    }

    const parsed = JSON.parse(rawContent) as Omit<UIGenerationResult, "generatedCode">;
    return {
      ...parsed,
      generatedCode: buildReactCode(parsed.componentTree)
    };
  } catch (error) {
    return buildFallbackResult(
      prdText,
      `AI request exception: ${(error as Error).message || "unknown error"}`
    );
  }
}
