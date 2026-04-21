"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { UIComponentNode, UIGenerationResult } from "@/lib/types";
import type { OrchestrationResponse } from "@/lib/orchestration/types";
import { InsightBoardPreview } from "@/components/insight-board-preview";
import { LiveComponentPreview } from "@/components/live-component-preview";
import { EmployeeMetricChartPreview } from "@/components/stress-employees-chart";
import { isTaskManagementIntent } from "@/components/task-flow-chrome";
import { TaskFlowInteractivePreview } from "@/components/task-flow-interactive-preview";
import { isAnalyticsDashboardSaaSIntent } from "@/lib/analytics-dashboard-intent";
import { parseEmployeeMetricChartIntent } from "@/lib/chart-intent";
import {
  appendRequirementsHistory,
  clearRequirementsHistory,
  loadRequirementsHistory,
  previewLine,
  removeRequirementsHistoryEntry,
  type RequirementsHistoryEntry
} from "@/lib/requirements-history";

type PreviewTab = "live" | "structure";

const MAX_PRD_FILE_BYTES = 5 * 1024 * 1024;

/** App mark: SU = Spec + To + UI (SpecToUI Agent). */
const APP_MARK = "SU";

/** Keep download names short — appName from the model can be a long sentence. */
const MAX_EXPORT_FILENAME_STEM = 48;

/** Server may replace generated code with the same preview component sources (see preview-aligned-export). */
const PREVIEW_ALIGNED_MARKER = "this export matches the Live UI preview";

function exportCodeFilename(appName: string, generatedCode: string): string {
  const stem =
    appName
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "generated";
  const clipped =
    stem.length > MAX_EXPORT_FILENAME_STEM
      ? stem.slice(0, MAX_EXPORT_FILENAME_STEM).replace(/-+$/, "")
      : stem;
  if (generatedCode.includes(PREVIEW_ALIGNED_MARKER)) {
    return `${clipped}-preview-source.txt`;
  }
  return `${clipped}-ui.tsx`;
}

function getCodeOutputSubtitle(result: UIGenerationResult | null): string {
  if (!result) return "Run the pipeline to see output.";
  if (result.generatedCode.includes(PREVIEW_ALIGNED_MARKER)) {
    return "Same source as Live preview — split into the files named in each section (download as .txt).";
  }
  if (result.generatedCode.includes("Rule-based preview")) {
    return "Rule-based fallback (no API key or model error). Add OPENAI_API_KEY or ANTHROPIC_API_KEY for fuller generated React.";
  }
  return "Generated from the component tree — matches the Live preview (generic tree view).";
}

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
  const depthSpacing = depth > 0 ? "ml-2" : "";
  const tone = getNodeTone(node.name);
  return (
    <div className={`${depthSpacing} rounded-lg border bg-gradient-to-br p-2 shadow-sm ${tone}`}>
      <div className="text-[10px] font-semibold tracking-wide text-slate-600">{node.name}</div>
      {label && <div className="text-xs font-medium text-slate-900">{label}</div>}
      {!label && <div className="text-[10px] text-slate-600">{node.purpose}</div>}
      {children.length > 0 && (
        <div className="mt-2 space-y-2 border-l border-dashed border-slate-300 pl-2">
          {children.map((child, idx) => (
            <TreePreview key={`${child.name}-${idx}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function sessionStorageKey(): string {
  return "spec-to-ui-agent-session";
}

export default function HomePage() {
  const [requirements, setRequirements] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [result, setResult] = useState<UIGenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("live");
  const [prdFileName, setPrdFileName] = useState<string | null>(null);
  const [prdUploading, setPrdUploading] = useState(false);
  const [uploadHint, setUploadHint] = useState<string | null>(null);
  const [requirementsHistory, setRequirementsHistory] = useState<RequirementsHistoryEntry[]>([]);
  const prdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = sessionStorageKey();
    let id = sessionStorage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `sess-${Date.now()}`;
      sessionStorage.setItem(key, id);
    }
    setSessionId(id);
  }, []);

  useEffect(() => {
    setRequirementsHistory(loadRequirementsHistory());
  }, []);

  const taskChrome = result && isTaskManagementIntent(requirements);
  const analyticsDashboardChrome = result && isAnalyticsDashboardSaaSIntent(requirements);
  const employeeMetricChartKind = result ? parseEmployeeMetricChartIntent(requirements) : null;

  const ingestPrdFile = useCallback(async (file: File) => {
    setUploadHint(null);
    if (file.size > MAX_PRD_FILE_BYTES) {
      setUploadHint("File too large (max 5 MB).");
      return;
    }

    const lower = file.name.toLowerCase();
    const isTextish =
      lower.endsWith(".txt") ||
      lower.endsWith(".md") ||
      file.type.startsWith("text/") ||
      file.type === "application/json";

    if (isTextish) {
      try {
        const text = await file.text();
        setRequirements(text);
        setPrdFileName(file.name);
        setUploadHint(`Loaded ${file.name} (${text.length.toLocaleString()} characters).`);
      } catch {
        setUploadHint("Could not read text file.");
      }
      return;
    }

    if (
      lower.endsWith(".pdf") ||
      lower.endsWith(".docx") ||
      file.type === "application/pdf" ||
      file.type.includes("wordprocessingml")
    ) {
      setPrdUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/parse-prd", { method: "POST", body });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Parse failed");
        }
        const text = data.text ?? "";
        if (!text.trim()) {
          setUploadHint("No text extracted from document (try another export or paste manually).");
        } else {
          setRequirements(text);
          setPrdFileName(file.name);
          setUploadHint(`Loaded ${file.name} (${text.length.toLocaleString()} characters).`);
        }
      } catch (e) {
        setUploadHint((e as Error).message);
      } finally {
        setPrdUploading(false);
      }
      return;
    }

    setUploadHint("Use .txt, .md, .pdf, or .docx");
  }, []);

  const onPrdInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void ingestPrdFile(file);
  };

  const onPrdDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void ingestPrdFile(file);
  };

  async function onGenerate() {
    setLoading(true);
    setError(null);
    try {
      const key = sessionStorageKey();
      let sid = sessionId;
      if (typeof window !== "undefined" && !sid) {
        sid = sessionStorage.getItem(key) ?? "";
      }
      if (!sid) {
        sid =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `sess-${Date.now()}`;
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, sid);
        setSessionId(sid);
      }

      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements, sessionId: sid })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }
      const full = data as OrchestrationResponse;
      setResult({
        appName: full.appName,
        description: full.description,
        componentTree: full.componentTree,
        generatedCode: full.generatedCode
      });
      setRequirementsHistory(appendRequirementsHistory(requirements, full.appName));
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
    link.download = exportCodeFilename(result.appName, result.generatedCode);
    link.click();
    URL.revokeObjectURL(url);
  }

  const codePanelText = !result ? "Run the pipeline to see output." : result.generatedCode;

  return (
    <div className="min-h-screen px-4 pb-10 pt-6 md:px-6">
      <header className="mx-auto mb-6 max-w-[1600px]">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-base font-bold tracking-tight text-white shadow-lg shadow-indigo-500/25"
            title="SpecToUI Agent"
            aria-label="SpecToUI Agent"
          >
            {APP_MARK}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              SpecToUI Agent
            </h1>
            <p className="text-xs text-slate-600 md:text-sm">
              PRD → multi-agent tools → live UI preview → export code
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-4 lg:h-[calc(100vh-7.5rem)] lg:min-h-0 lg:grid-cols-12 lg:gap-5 lg:items-stretch">
        {/* Left: Chat & requirements — scrollable body */}
        <section className="glass-panel flex max-h-[min(88vh,calc(100vh-5.5rem))] min-h-0 flex-col p-5 lg:col-span-4 lg:max-h-none lg:h-full">
          <div className="shrink-0">
            <h2 className="text-sm font-semibold text-slate-800">Chat &amp; Requirements</h2>
            <p className="mt-1 text-xs text-slate-500">
              Paste or refine your PRD. Agents read this text and tools build the UI tree.
            </p>
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-y-contain pr-1 [scrollbar-gutter:stable]">
          <div className="space-y-2 rounded-xl border border-white/60 bg-white/40 p-3 text-xs text-slate-600 backdrop-blur-sm">
            <div className="font-medium text-slate-700">Assistant</div>
            <p>
              I&apos;ll analyze your requirements, generate a component tree, validate structure, and render
              a live preview. For dashboard, task, and chart PRDs, the download uses the same preview source
              files as on screen.
            </p>
          </div>

          <div className="mt-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Upload PRD
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              PDF, Word (.docx), or plain text (.txt / .md). Text is sent to the agents as requirements.
            </p>
            <input
              ref={prdInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={onPrdInputChange}
            />
            <button
              type="button"
              disabled={prdUploading || loading}
              onClick={() => prdInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onPrdDrop}
              className="mt-2 flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300/80 bg-white/50 px-4 py-6 text-center transition hover:border-indigo-400/80 hover:bg-indigo-50/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-2xl leading-none text-slate-400" aria-hidden>
                ⭳
              </span>
              <span className="text-sm font-medium text-slate-700">
                {prdUploading ? "Reading document…" : "Choose file or drop here"}
              </span>
              <span className="text-[11px] text-slate-500">Max 5 MB</span>
            </button>
            {prdFileName && (
              <p className="mt-1.5 truncate text-[11px] text-slate-600" title={prdFileName}>
                Current file: <span className="font-medium">{prdFileName}</span>
              </p>
            )}
            {uploadHint && (
              <p
                className={`mt-1 text-[11px] ${uploadHint.startsWith("Loaded") ? "text-emerald-700" : "text-amber-800"}`}
              >
                {uploadHint}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              PRD / message
            </label>
            <textarea
              className="mt-1.5 h-56 w-full resize-y rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2.5 text-sm text-slate-800 shadow-inner outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/60"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Describe the product or screen you want…"
            />
          </div>

          <details className="mt-4 rounded-xl border border-slate-200/60 bg-white/40 backdrop-blur-sm">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                <span>Requirements history</span>
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {requirementsHistory.length} saved
                </span>
              </span>
            </summary>
            <div className="border-t border-slate-200/50 px-3 pb-3 pt-1">
              <p className="text-[11px] leading-relaxed text-slate-500">
                Each successful <strong className="font-medium text-slate-600">Generate UI</strong>{" "}
                is stored in this browser. Open an entry to load it into the PRD box.
              </p>
              {requirementsHistory.length === 0 ? (
                <p className="mt-3 text-center text-xs text-slate-500">
                  No entries yet — generate once to build your history.
                </p>
              ) : (
                <ul className="mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
                  {requirementsHistory.map((h) => (
                    <li
                      key={h.id}
                      className="flex gap-2 rounded-lg border border-slate-200/70 bg-white/60 px-2 py-1.5 text-[11px]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800" title={previewLine(h.text)}>
                          {previewLine(h.text, 56)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {new Date(h.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short"
                          })}
                          {h.appName ? ` · ${h.appName}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          className="rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500"
                          onClick={() => setRequirements(h.text)}
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-200/80"
                          onClick={() =>
                            setRequirementsHistory(removeRequirementsHistoryEntry(h.id))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {requirementsHistory.length > 0 && (
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg border border-red-200/80 bg-red-50/80 py-1.5 text-[11px] font-medium text-red-800 hover:bg-red-100/90"
                  onClick={() => {
                    if (typeof window !== "undefined" && window.confirm("Clear all saved requirements?")) {
                      clearRequirementsHistory();
                      setRequirementsHistory([]);
                    }
                  }}
                >
                  Clear all history
                </button>
              )}
            </div>
          </details>

          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onGenerate}
            disabled={loading}
          >
            {loading ? "Working…" : "Generate UI"}
          </button>
          {sessionId && (
            <p className="mt-2 truncate text-center text-[10px] text-slate-400" title={sessionId}>
              Session: {sessionId.slice(0, 8)}…
            </p>
          )}
          {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
          </div>
        </section>

        {/* Middle: UI Preview */}
        <section className="glass-panel flex max-h-[min(88vh,calc(100vh-5.5rem))] min-h-0 flex-col p-5 lg:col-span-4 lg:max-h-none lg:h-full">
          <div className="flex shrink-0 items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">UI Preview</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {employeeMetricChartKind
                  ? `${employeeMetricChartKind === "salary" ? "Salary" : "Stress"} vs. employees: live bar chart (recharts). Code export includes these same preview files.`
                  : analyticsDashboardChrome
                    ? "InsightBoard-style SaaS dashboard: sidebar, KPIs, charts, filters, activity. Code export includes the same preview components."
                    : result && isTaskManagementIntent(requirements)
                      ? "Interactive task board. Code export includes the same preview components; Structure shows the pipeline tree."
                      : "Live render from the component tree (aligned with export)."}
              </p>
            </div>
            <div className="flex shrink-0 rounded-lg bg-slate-100/80 p-0.5 ring-1 ring-slate-200/80">
              <button
                type="button"
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
                  previewTab === "live"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600"
                }`}
                onClick={() => setPreviewTab("live")}
              >
                Live
              </button>
              <button
                type="button"
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
                  previewTab === "structure"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600"
                }`}
                onClick={() => setPreviewTab("structure")}
              >
                Structure
              </button>
            </div>
          </div>

          <div className="mt-4 flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/25 p-2 shadow-inner ring-1 ring-slate-200/40 backdrop-blur-sm lg:min-h-0">
            {!result ? (
              <div className="flex h-full min-h-[380px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-slate-500">
                <div className="text-3xl opacity-40" aria-hidden>
                  ◇
                </div>
                Add requirements and generate to see a polished preview here.
              </div>
            ) : previewTab === "structure" ? (
              <div className="h-full max-h-[560px] overflow-auto p-2">
                <TreePreview node={result.componentTree} />
              </div>
            ) : employeeMetricChartKind ? (
              <EmployeeMetricChartPreview kind={employeeMetricChartKind} />
            ) : analyticsDashboardChrome ? (
              <InsightBoardPreview key={requirements} requirements={requirements} />
            ) : taskChrome ? (
              <TaskFlowInteractivePreview key={requirements} requirements={requirements} />
            ) : (
              <div className="flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/35 shadow-inner">
                <div className="border-b border-white/50 bg-white/50 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
                  {result.appName}
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-3">
                  <LiveComponentPreview root={result.componentTree} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right: Code — scrollable output */}
        <section className="glass-panel flex max-h-[min(88vh,calc(100vh-5.5rem))] min-h-0 flex-col p-5 lg:col-span-4 lg:max-h-none lg:h-full">
          <div className="shrink-0">
            <h2 className="text-sm font-semibold text-slate-800">Code output</h2>
            <p className="mt-1 text-xs text-slate-500">
              {getCodeOutputSubtitle(result)}
            </p>
          </div>

          <pre className="mt-3 min-h-[12rem] min-w-0 flex-1 overflow-auto rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-100 shadow-inner [scrollbar-gutter:stable]">
            {codePanelText}
          </pre>

          <button
            type="button"
            className="mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onExportCode}
            disabled={!result}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download code
          </button>
        </section>
      </main>
    </div>
  );
}
