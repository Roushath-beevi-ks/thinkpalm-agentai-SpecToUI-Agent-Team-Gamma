"use client";

import { useMemo, useState } from "react";
import type { UIComponentNode, UIGenerationResult } from "@/lib/types";

type Tab = "json" | "react";

const starterPRD = `Build a task management app where users can:
- View list of tasks
- Add new task
- Mark task complete
- Filter by status
- Responsive design`;

function getNodeTone(name: string): string {
  if (/button/i.test(name)) return "from-blue-50 to-indigo-50 border-blue-200";
  if (/input/i.test(name)) return "from-emerald-50 to-teal-50 border-emerald-200";
  if (/header|title|subtitle/i.test(name))
    return "from-violet-50 to-purple-50 border-violet-200";
  return "from-white to-slate-50 border-slate-200";
}

function TreePreview({ node, depth = 0 }: { node: UIComponentNode; depth?: number }) {
  const children = node.children ?? [];
  const label = typeof node.props?.text === "string" ? node.props.text : null;
  const depthSpacing = depth > 0 ? "ml-3" : "";
  const tone = getNodeTone(node.name);
  return (
    <div className={`${depthSpacing} rounded-xl border bg-gradient-to-br p-3 shadow-sm ${tone}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold tracking-wide text-slate-600">{node.name}</div>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          {children.length} child{children.length === 1 ? "" : "ren"}
        </span>
      </div>
      {label && <div className="text-sm font-medium text-slate-900">{label}</div>}
      {!label && <div className="text-xs text-slate-600">{node.purpose}</div>}
      {children.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-dashed border-slate-300 pl-3">
          {children.map((child, idx) => (
            <TreePreview key={`${child.name}-${idx}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [requirements, setRequirements] = useState(starterPRD);
  const [result, setResult] = useState<UIGenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("json");

  const jsonOutput = useMemo(() => {
    if (!result) return "";
    return JSON.stringify(
      {
        appName: result.appName,
        description: result.description,
        componentTree: result.componentTree
      },
      null,
      2
    );
  }, [result]);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }
      setResult(data as UIGenerationResult);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function onExportCode() {
    if (!result) return;
    const blob = new Blob([result.generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "generated-ui.tsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">
        AI PRD to UI Component Generator
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        Turn plain requirements into a styled component tree with exportable React + Tailwind code.
      </p>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Prompt Engineering</h2>
        <p className="mt-1 text-sm text-slate-600">
          The backend uses a constrained JSON-only system prompt and schema guardrails
          so the AI returns a reliable component tree and Tailwind-ready structure.
          Without an API key, it still produces a dynamic rule-based tree from your
          latest requirements.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Requirements Input</h2>
          <textarea
            className="h-72 w-full rounded-md border border-slate-300 p-3 text-sm"
            value={requirements}
            onChange={(event) => setRequirements(event.target.value)}
            placeholder="Paste PRD requirements..."
          />
          <button
            className="mt-3 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            onClick={onGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate UI"}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Generated Preview</h2>
          <div className="h-80 overflow-auto rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 p-3">
            {result ? (
              <TreePreview node={result.componentTree} />
            ) : (
              <p className="text-sm text-slate-500">
                Generate output to see component hierarchy.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Code Output</h2>
          <div className="mb-2 flex gap-2">
            <button
              className={`rounded px-3 py-1 text-sm ${activeTab === "json" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
              onClick={() => setActiveTab("json")}
            >
              JSON Structure
            </button>
            <button
              className={`rounded px-3 py-1 text-sm ${activeTab === "react" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
              onClick={() => setActiveTab("react")}
            >
              React Code
            </button>
          </div>

          <pre className="h-72 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
            {result
              ? activeTab === "json"
                ? jsonOutput
                : result.generatedCode
              : "No output yet"}
          </pre>

          <button
            className="mt-3 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            onClick={onExportCode}
            disabled={!result}
          >
            Export Code
          </button>
        </section>
      </div>
    </main>
  );
}
