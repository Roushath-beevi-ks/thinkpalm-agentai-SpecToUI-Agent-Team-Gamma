import type { MemoryEntry } from "@/lib/orchestration/types";

const stores = new Map<string, MemoryEntry[]>();

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSessionMemory(sessionId: string): MemoryEntry[] {
  if (!stores.has(sessionId)) {
    stores.set(sessionId, []);
  }
  return stores.get(sessionId)!;
}

export function appendMemory(
  sessionId: string,
  entry: Omit<MemoryEntry, "id" | "createdAt">
): MemoryEntry {
  const list = getSessionMemory(sessionId);
  const full: MemoryEntry = {
    ...entry,
    id: randomId(),
    createdAt: Date.now()
  };
  list.push(full);
  return full;
}

export function memoryContextForAgents(sessionId: string, maxEntries = 12): string {
  const list = getSessionMemory(sessionId);
  return list
    .slice(-maxEntries)
    .map((e) => `[${e.role}] ${e.content}`)
    .join("\n");
}
