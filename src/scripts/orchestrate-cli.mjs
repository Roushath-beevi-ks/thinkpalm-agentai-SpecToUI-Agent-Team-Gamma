#!/usr/bin/env node
/**
 * CLI for multi-agent orchestration API.
 * Usage:
 *   node src/scripts/orchestrate-cli.mjs --url http://localhost:3000 --requirements "Build a login page"
 *   echo "PRD text" | node src/scripts/orchestrate-cli.mjs --url http://localhost:3001
 */

const args = process.argv.slice(2);

function getArg(name, fallback = "") {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
}

const baseUrl = getArg("--url", "http://localhost:3000").replace(/\/$/, "");
const requirementsFromFlag = getArg("--requirements", "");
const sessionId = getArg("--session", `cli-${Date.now()}`);

async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function main() {
  const stdin = await readStdin();
  const requirements = (requirementsFromFlag || stdin).trim();
  if (!requirements) {
    console.error(
      "Usage: node scripts/orchestrate-cli.mjs --url http://localhost:3001 --requirements \"Your PRD\""
    );
    process.exit(1);
  }

  const res = await fetch(`${baseUrl}/api/orchestrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requirements, sessionId })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Error:", data.error || res.status);
    process.exit(1);
  }

  console.log("--- Agents ---");
  for (const step of data.orchestration?.agentSteps ?? []) {
    console.log(`[${step.agent}] ${step.phase}: ${step.message}`);
  }
  console.log("\n--- Tool calls ---");
  for (const t of data.orchestration?.toolCalls ?? []) {
    console.log(`[${t.agent}] ${t.toolName} → ${t.resultSummary}`);
  }
  console.log("\n--- Memory (last 6) ---");
  const mem = data.orchestration?.memory ?? [];
  for (const m of mem.slice(-6)) {
    console.log(`[${m.role}] ${m.content}`);
  }
  console.log("\n--- UI ---");
  console.log("appName:", data.appName);
  console.log("description:", data.description);
  console.log("\nReact export (first 500 chars):\n", (data.generatedCode || "").slice(0, 500));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
