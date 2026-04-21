# SpecToUI Agent

**Project name:** SpecToUI Agent (mini-project: PRD/spec → UI)
**Problem:** Product and engineering teams often start from long requirement documents, but turning a PRD into a first-pass UI is slow and inconsistent. Manual wireframes or ad-hoc prompts do not always produce a structured, exportable result that matches the spec.

**What we built:** A web app where an AI-assisted pipeline reads product requirements (paste or upload PDF/Word/text), produces a **Tailwind-oriented component tree**, a **live preview**, and **downloadable React code**, with optional **multi-agent** steps (analysis → build → review) and **session memory** for transparency.

---

## Team members and contributions

| Name | Contributions |
|------|----------------|
| **Roushath Beevi K S** | I built SpecToUI Agent, a Next.js app that takes a PRD (text or file), runs it through an AI pipeline, and returns a live UI preview plus downloadable React code._ |


*(Edit the contribution cells to match what each person actually did.)*

---

## Tech stack (with versions)

| Layer | Technology | Version (see `package.json`) |
|--------|------------|-------------------------------|
| Framework | Next.js (App Router) | ^16.2.3 |
| UI | React | ^19.2.5 |
| Language | TypeScript | ^6.0.2 |
| Styling | Tailwind CSS | ^4.2.2 |
| Charts | Recharts | ^3.8.1 |
| Documents | mammoth (DOCX), pdf2json (PDF) | ^1.12.0 / ^4.0.3 |
| AI | Anthropic Claude and/or OpenAI API | (via env; see `.env.example`) |
| Tests | Vitest | ^3.2.4 |
| Runtime | Node.js | 20+ recommended |

---

## Step-by-step: how to run locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/Roushath-beevi-ks/thinkpalm-agentai-SpecToUI-Agent-Team-Gamma.git
   cd <repo-folder>		
