# SpecToUI Agent — Architecture (one page)

## Purpose

The application turns **product requirements text** (paste or PDF/DOCX upload) into a **Tailwind-oriented UI component tree**, a **live preview**, and **exportable React code**. Optional **multi-agent orchestration** runs analysis → UI build → validation with session memory and tool traces.

## High-level flow

1. **Browser** sends PRD text to Next.js **Route Handlers** (`POST /api/orchestrate` or `/api/generate-ui`). Document text for PDF/DOCX is extracted server-side via `POST /api/parse-prd`.
2. **Generation** (`src/lib/ai.ts`) calls **Claude** or **OpenAI** (env-driven) with a strict **JSON schema** system prompt; on failure or missing keys, a **rule-based fallback tree** fills the same shape.
3. **Orchestration** (`src/lib/agents/pipeline.ts`) chains tools: `analyze_requirements` → `build_ui_from_prd` → `validate_component_tree`, writing to **session memory** (`src/lib/memory/session-memory.ts`).
4. **UI** (`src/app/page.tsx`) shows **Live** previews (generic tree renderer, task board, analytics dashboard, or employee charts) and **Structure** / **Code** tabs. **Requirements history** is stored in **localStorage** (`src/lib/requirements-history.ts`).

## Key modules

| Area | Role |
|------|------|
| `src/app` | App Router pages, global styles, API routes |
| `src/components` | Previews (`LiveComponentPreview`, task/analytics shells) |
| `src/lib` | AI prompts, tools, PDF parsing, intents |
| `src/scripts` | Optional CLI hitting `/api/orchestrate` |

## Data boundaries

- **Secrets**: only in `.env.local` on the server (never sent to the client except your own keys in StackBlitz env).
- **PRD content**: processed on the server for generation; uploads are parsed in-memory for `/api/parse-prd`.

## Diagram

- **`architecture-diagram.png`** — architecture overview for docs, slides, or PDFs.
