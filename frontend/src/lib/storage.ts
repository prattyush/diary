const ENTRIES_KEY = "diary_entries";
const TEMPLATE_KEY = "diary_template";

export interface DiaryEntry {
  content: string;
  updatedAt: string;
}

function getAllEntries(): Record<string, DiaryEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getEntry(date: string): DiaryEntry | null {
  const entries = getAllEntries();
  return entries[date] ?? null;
}

export function saveEntry(date: string, content: string): void {
  const entries = getAllEntries();
  entries[date] = { content, updatedAt: new Date().toISOString() };
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function deleteEntry(date: string): void {
  const entries = getAllEntries();
  delete entries[date];
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function getDatesWithEntries(): string[] {
  const entries = getAllEntries();
  return Object.keys(entries).filter((d) => entries[d].content.trim() !== "");
}

export function getTemplate(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TEMPLATE_KEY) ?? "";
}

export function saveTemplate(content: string): void {
  localStorage.setItem(TEMPLATE_KEY, content);
}
