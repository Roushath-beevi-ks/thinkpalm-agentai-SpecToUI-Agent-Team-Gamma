"use client";

import type { ReactNode } from "react";

type Props = {
  appLabel: string;
  children: ReactNode;
  requirementsSnippet: string;
};

export function TaskFlowChrome({ appLabel, children, requirementsSnippet }: Props) {
  return (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-inner ring-1 ring-slate-200/60 backdrop-blur-md">
      <header className="flex items-center justify-between gap-2 border-b border-white/50 bg-white/50 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md">
            {appLabel.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{appLabel}</div>
            <div className="max-w-[200px] truncate text-[10px] text-slate-500" title={requirementsSnippet}>
              From your requirements
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100/80 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            Preview
          </span>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 ring-2 ring-white shadow" />
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-white/40 bg-white/30 px-3 py-3 backdrop-blur-sm">
        <div className="rounded-xl bg-gradient-to-br from-amber-100/90 to-amber-50 px-2 py-2 shadow-sm ring-1 ring-amber-200/50">
          <div className="text-[10px] font-medium text-amber-800/80">Completed</div>
          <div className="text-lg font-bold text-amber-900">28</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-100/90 to-blue-50 px-2 py-2 shadow-sm ring-1 ring-blue-200/50">
          <div className="text-[10px] font-medium text-blue-800/80">Active</div>
          <div className="text-lg font-bold text-blue-900">8</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-violet-100/90 to-violet-50 px-2 py-2 shadow-sm ring-1 ring-violet-200/50">
          <div className="text-[10px] font-medium text-violet-800/80">Queued</div>
          <div className="text-lg font-bold text-violet-900">20</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-gradient-to-b from-slate-50/80 to-white/60 p-3">
        {children}
      </div>
    </div>
  );
}

export function isTaskManagementIntent(text: string): boolean {
  return /task|todo|taskflow|task flow|task management|checklist/i.test(text);
}
