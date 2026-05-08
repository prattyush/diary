import {
  saveEntry,
  getEntry,
  deleteEntry,
  getDatesWithEntries,
  saveTemplate,
  getTemplate,
} from "@/lib/storage";

// Provide a simple localStorage mock for the jsdom environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

beforeEach(() => localStorageMock.clear());

describe("diary entry storage", () => {
  test("saves and retrieves an entry", () => {
    saveEntry("2026-05-08", "Hello diary");
    const entry = getEntry("2026-05-08");
    expect(entry).not.toBeNull();
    expect(entry?.content).toBe("Hello diary");
  });

  test("returns null for a date with no entry", () => {
    expect(getEntry("2026-01-01")).toBeNull();
  });

  test("overwrites an existing entry on re-save", () => {
    saveEntry("2026-05-08", "First version");
    saveEntry("2026-05-08", "Updated version");
    expect(getEntry("2026-05-08")?.content).toBe("Updated version");
  });

  test("deletes an entry", () => {
    saveEntry("2026-05-08", "To be deleted");
    deleteEntry("2026-05-08");
    expect(getEntry("2026-05-08")).toBeNull();
  });

  test("getDatesWithEntries omits empty-content entries", () => {
    saveEntry("2026-05-08", "Has content");
    saveEntry("2026-05-09", "   ");
    saveEntry("2026-05-10", "Also has content");
    const dates = getDatesWithEntries();
    expect(dates).toContain("2026-05-08");
    expect(dates).not.toContain("2026-05-09");
    expect(dates).toContain("2026-05-10");
  });

  test("getDatesWithEntries returns empty array when nothing saved", () => {
    expect(getDatesWithEntries()).toEqual([]);
  });
});

describe("template storage", () => {
  test("saves and retrieves template", () => {
    saveTemplate("# Morning\n\n# Evening");
    expect(getTemplate()).toBe("# Morning\n\n# Evening");
  });

  test("returns empty string when no template set", () => {
    expect(getTemplate()).toBe("");
  });

  test("overwrites existing template", () => {
    saveTemplate("# Old");
    saveTemplate("# New");
    expect(getTemplate()).toBe("# New");
  });
});
