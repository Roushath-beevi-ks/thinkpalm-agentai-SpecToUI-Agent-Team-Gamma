const STORAGE_KEY = "spec-to-ui-agent-requirements-history";
const MAX_ENTRIES = 60;

export type RequirementsHistoryEntry = {
  id: string;
  text: string;
  createdAt: number;
  appName?: string;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadRequirementsHistory(): RequirementsHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is RequirementsHistoryEntry =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as RequirementsHistoryEntry).id === "string" &&
          typeof (e as RequirementsHistoryEntry).text === "string" &&
          typeof (e as RequirementsHistoryEntry).createdAt === "number"
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function persist(entries: RequirementsHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

/** Add or move to top if the same text already exists (dedupe by trimmed body). */
export function appendRequirementsHistory(text: string, appName?: string): RequirementsHistoryEntry[] {
  const trimmed = text.trim();
  if (!trimmed) return loadRequirementsHistory();

  const prev = loadRequirementsHistory();
  const filtered = prev.filter((e) => e.text.trim() !== trimmed);
  const entry: RequirementsHistoryEntry = {
    id: newId(),
    text: trimmed,
    createdAt: Date.now(),
    appName: appName?.trim() || undefined
  };
  const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
  persist(next);
  return next;
}

export function removeRequirementsHistoryEntry(id: string): RequirementsHistoryEntry[] {
  const next = loadRequirementsHistory().filter((e) => e.id !== id);
  persist(next);
  return next;
}

export function clearRequirementsHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function previewLine(text: string, maxLen = 72): string {
  const one = text.replace(/\s+/g, " ").trim();
  if (one.length <= maxLen) return one;
  return `${one.slice(0, maxLen - 1)}…`;
}
