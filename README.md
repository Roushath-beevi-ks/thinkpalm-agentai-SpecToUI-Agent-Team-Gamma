# SpecToUI Agent — AI UI from PRDs

Next.js app where an AI agent reads a product requirements document (PRD) and produces a **Tailwind CSS component tree**, **live preview**, and **downloadable React code**. Includes **prompt engineering** (structured JSON schema + rules in `src/lib/ai.ts`), optional **multi-agent orchestration** with tool traces (`/api/orchestrate`), and **PDF / Word / text** ingestion (`/api/parse-prd`).

## Repository layout

| Path | Contents |
|------|----------|
| **`src/`** | Application source: `app/`, `components/`, `lib/`, `scripts/` |
| **`docs/`** | `ARCHITECTURE.md`, **`architecture-diagram.png`**, `screenshots/` |
| **`tests/`** | Vitest unit tests (`npm test`) |
| **`examples/`** | Sample PRD text files for demos |
| **`package.json`** | Dependencies and npm scripts (Node.js; see also `requirements.txt`) |
| **`requirements.txt`** | Pointer: Python is not used — use `npm install` |

## Screenshots

Add your UI captures under **`docs/screenshots/`** (e.g. main dashboard, PRD upload, code export) and reference them here or in your report:

- `docs/screenshots/main-ui.png` — home: Chat & Requirements, UI Preview, Code output  
- `docs/screenshots/insightboard-preview.png` — analytics dashboard live preview (optional)

## Assessment mapping

| Requirement | Where it lives |
|-------------|----------------|
| React / Next.js + TypeScript | `src/app/`, `src/components/`, `src/lib/` |
| Tailwind CSS | `src/app/globals.css`, Tailwind v4 PostCSS |
| AI (Claude or OpenAI) | `src/lib/ai.ts` — set `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` |
| Prompt engineering | `systemPrompt`, `buildUserPrompt`, rule-based fallback in `src/lib/ai.ts` |
| Component preview | `src/components/live-component-preview.tsx`, task/chart previews |
| Export to code | **Download code** on the home page; React + JSON + agent trace tabs |
| PRD upload | PDF, `.docx`, `.txt`, `.md` — drag-and-drop or file picker on `src/app/page.tsx` |

## Prerequisites

- Node.js 20+ recommended  
- An [Anthropic](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/) API key  

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**

   Copy `.env.example` to `.env.local` and add at least one API key:

   ```bash
   cp .env.example .env.local
   ```

   - If both keys are set, **Anthropic is used by default** unless you set `AI_PROVIDER=openai`.
   - With **no keys**, the app still runs using a **local rule-based UI fallback** (good for UI-only demos; not representative of full AI quality).

4. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Production build**

   ```bash
   npm run build
   npm start
   ```

6. **Tests** (optional)

   ```bash
   npm test
   ```

## Demo workflow (for your Loom / YouTube video)

1. Show the GitHub repo and README setup (clone, `.env.local`, `npm run dev`).
2. Optionally open `examples/sample-prd-taskflow.txt`, **`examples/insightboard-prd.txt`** (analytics / KPI / charts — dashboard live preview), or a **PDF export** of your own PRD.
3. In the app: **Upload PRD** (drop PDF or paste from the sample file).
4. Leave all **Agents** checked and click **Generate UI**.
5. Walk through **Live** vs **Structure** preview, then **JSON** / **React** / **Agents** tabs.
6. Click **Download code** and mention dropping the file into a Next.js page or StackBlitz.

## StackBlitz

1. Push this project to a **public** GitHub repository.
2. In [StackBlitz](https://stackblitz.com/), use **Import from GitHub** and select the repo.
3. Add secrets: StackBlitz project settings → environment variables → paste `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (same names as `.env.example`).
4. Run the dev server from the StackBlitz UI.

## CLI (optional)

```bash
npm run cli -- --url http://localhost:3000 --requirements "Your PRD text here"
```

Calls the running app’s `/api/orchestrate` endpoint (start `npm run dev` first).

## Project structure (source)

- `src/app/page.tsx` — main UI: PRD input, upload, preview, code tabs, export  
- `src/app/api/generate-ui/route.ts` — single-shot generation  
- `src/app/api/orchestrate/route.ts` — analyst → builder → reviewer pipeline  
- `src/app/api/parse-prd/route.ts` — PDF / DOCX / text extraction  
- `src/lib/ai.ts` — prompts, LLM calls, JSX export, fallback trees  
- `src/lib/agents/pipeline.ts` — orchestration and session memory  

## License

MIT
