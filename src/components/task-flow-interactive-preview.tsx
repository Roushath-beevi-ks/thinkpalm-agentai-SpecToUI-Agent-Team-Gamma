"use client";

import { useCallback, useMemo, useState } from "react";
import {
  IconCheck,
  IconClose,
  IconEdit,
  IconEye,
  IconTrash,
  IconUndo
} from "@/components/task-action-icons";
import {
  extractCoreFeatureLines,
  extractDisplayHeader,
  extractOverviewOneLiner
} from "@/lib/prd-metadata";

type Filter = "all" | "active" | "completed";
type DemoState = "normal" | "loading" | "empty" | "error";

export type TaskItem = {
  id: string;
  title: string;
  completed: boolean;
};

const DEFAULT_TASKS: Omit<TaskItem, "id">[] = [
  { title: "Dashboard – View tasks and summary", completed: true },
  { title: "Add Task – Create new tasks", completed: false },
  { title: "Task List – Display tasks with status", completed: false },
  { title: "Task Actions – Edit, delete, mark complete", completed: false },
  { title: "Filters – All, Active, Completed", completed: false },
  { title: "Search – Search tasks", completed: false }
];

function id(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type Props = {
  requirements: string;
};

export function TaskFlowInteractivePreview({ requirements }: Props) {
  const { title, subtitle } = useMemo(() => extractDisplayHeader(requirements), [requirements]);
  const overviewLine = useMemo(() => extractOverviewOneLiner(requirements), [requirements]);

  const seedTitles = useMemo(() => {
    const fromPrd = extractCoreFeatureLines(requirements);
    if (fromPrd.length > 0) return fromPrd;
    return DEFAULT_TASKS.map((t) => t.title);
  }, [requirements]);

  const [tasks, setTasks] = useState<TaskItem[]>(() =>
    seedTitles.map((titleText, i) => ({
      id: id(),
      title: titleText,
      completed: i === 0
    }))
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoState>("normal");

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "active") list = list.filter((t) => !t.completed);
    if (filter === "completed") list = list.filter((t) => t.completed);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
    return list;
  }, [tasks, filter, search]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = tasks.filter((t) => !t.completed).length;
  const total = tasks.length;

  const addTask = useCallback(() => {
    const t = draft.trim();
    if (!t) return;
    setTasks((prev) => [...prev, { id: id(), title: t, completed: false }]);
    setDraft("");
  }, [draft]);

  const toggleComplete = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setEditingId((e) => (e === taskId ? null : e));
  }, []);

  const startEdit = useCallback((task: TaskItem) => {
    setEditingId(task.id);
    setEditText(task.title);
  }, []);

  const saveEdit = useCallback(() => {
    const t = editText.trim();
    if (!editingId || !t) return;
    setTasks((prev) =>
      prev.map((x) => (x.id === editingId ? { ...x, title: t } : x))
    );
    setEditingId(null);
  }, [editingId, editText]);

  const iconBtnBase =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1";
  const viewingTask = viewingId ? tasks.find((t) => t.id === viewingId) : undefined;

  const filterBtn = (f: Filter, label: string) => (
    <button
      key={f}
      type="button"
      onClick={() => setFilter(f)}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
        filter === f
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/90 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-inner ring-1 ring-slate-200/60 backdrop-blur-md">
      <header className="flex items-center justify-between gap-2 border-b border-white/50 bg-white/50 px-4 py-3 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md">
            {title.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">{title}</div>
            <div className="truncate text-[10px] text-slate-500" title={overviewLine || subtitle}>
              {subtitle}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-slate-100/80 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            Interactive
          </span>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 ring-2 ring-white shadow" />
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-white/40 bg-white/30 px-3 py-3 backdrop-blur-sm">
        <div className="rounded-xl bg-gradient-to-br from-amber-100/90 to-amber-50 px-2 py-2 shadow-sm ring-1 ring-amber-200/50">
          <div className="text-[10px] font-medium text-amber-800/80">Completed</div>
          <div className="text-lg font-bold text-amber-900">{demo === "loading" ? "…" : completedCount}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-100/90 to-blue-50 px-2 py-2 shadow-sm ring-1 ring-blue-200/50">
          <div className="text-[10px] font-medium text-blue-800/80">Active</div>
          <div className="text-lg font-bold text-blue-900">{demo === "loading" ? "…" : activeCount}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-violet-100/90 to-violet-50 px-2 py-2 shadow-sm ring-1 ring-violet-200/50">
          <div className="text-[10px] font-medium text-violet-800/80">Total</div>
          <div className="text-lg font-bold text-violet-900">{demo === "loading" ? "…" : total}</div>
        </div>
      </div>

      <div className="border-b border-white/40 bg-white/20 px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["normal", "Normal"],
              ["loading", "Loading"],
              ["empty", "Empty"],
              ["error", "Error"]
            ] as const
          ).map(([k, lab]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDemo(k)}
              className={`rounded-lg px-2 py-1 text-[10px] font-medium ${
                demo === k
                  ? "bg-slate-800 text-white"
                  : "bg-white/70 text-slate-600 ring-1 ring-slate-200/80"
              }`}
            >
              {lab}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-gradient-to-b from-slate-50/80 to-white/60 p-3">
        {demo === "loading" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            Loading tasks…
          </div>
        ) : demo === "error" ? (
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-center text-sm text-red-800">
            Something went wrong.{" "}
            <button
              type="button"
              className="font-semibold text-red-900 underline"
              onClick={() => setDemo("normal")}
            >
              Retry
            </button>
          </div>
        ) : demo === "empty" || tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-600">
            No tasks yet. Add one below or switch demo to Normal.
            {demo === "empty" && (
              <button
                type="button"
                className="mt-3 block w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white"
                onClick={() => setDemo("normal")}
              >
                Back to Normal
              </button>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            <div>
              <label className="sr-only" htmlFor="task-search">
                Search tasks
              </label>
              <input
                id="task-search"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Search tasks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Add a new task…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <button
                type="button"
                onClick={addTask}
                className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
              >
                Add Task
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterBtn("all", "All")}
              {filterBtn("active", "Active")}
              {filterBtn("completed", "Completed")}
            </div>

            <ul className="space-y-2">
              {filtered.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center"
                >
                  <button
                    type="button"
                    aria-pressed={task.completed}
                    onClick={() => toggleComplete(task.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 transition ${
                      task.completed
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    {task.completed ? "✓" : ""}
                  </button>

                  <div className="min-w-0 flex-1">
                    {editingId === task.id ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className={`${iconBtnBase} bg-blue-600 text-white hover:bg-blue-700`}
                            onClick={saveEdit}
                            aria-label="Save task"
                            title="Save"
                          >
                            <IconCheck className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={`${iconBtnBase} bg-slate-100 text-slate-600 hover:bg-slate-200`}
                            onClick={() => setEditingId(null)}
                            aria-label="Cancel edit"
                            title="Cancel"
                          >
                            <IconClose className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`text-sm ${task.completed ? "text-slate-400 line-through" : "font-medium text-slate-800"}`}
                      >
                        {task.title}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1 sm:justify-end">
                    <button
                      type="button"
                      className={`${iconBtnBase} bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900`}
                      onClick={() => setViewingId(task.id)}
                      aria-label="View task details"
                      title="View"
                    >
                      <IconEye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={`${iconBtnBase} bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900`}
                      onClick={() => startEdit(task)}
                      aria-label="Edit task"
                      title="Edit"
                    >
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={`${iconBtnBase} bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900`}
                      onClick={() => toggleComplete(task.id)}
                      aria-label={task.completed ? "Mark task active" : "Mark task completed"}
                      title={task.completed ? "Undo complete" : "Mark done"}
                    >
                      {task.completed ? (
                        <IconUndo className="h-4 w-4" />
                      ) : (
                        <IconCheck className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      className={`${iconBtnBase} bg-red-50 text-red-600 ring-1 ring-red-200/80 hover:bg-red-100 hover:text-red-700`}
                      onClick={() => removeTask(task.id)}
                      aria-label="Delete task"
                      title="Delete"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        task.completed
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/90"
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/90"
                      }`}
                    >
                      {task.completed ? "Completed" : "Active"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {viewingTask && (
        <div
          className="absolute inset-0 z-20 flex items-end justify-center bg-slate-900/35 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-view-title"
          onClick={() => setViewingId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 id="task-view-title" className="text-sm font-semibold text-slate-900">
                Task details
              </h3>
              <button
                type="button"
                className={`${iconBtnBase} text-slate-500 hover:bg-slate-100`}
                onClick={() => setViewingId(null)}
                aria-label="Close"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-800">{viewingTask.title}</p>
            <p className="mt-2 text-xs text-slate-500">
              Status:{" "}
              <span className="font-medium text-slate-700">
                {viewingTask.completed ? "Completed" : "Active"}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
