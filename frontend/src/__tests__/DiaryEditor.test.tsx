import { render, screen, fireEvent, act } from "@testing-library/react";
import DiaryEditor from "@/components/DiaryEditor";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

beforeEach(() => localStorageMock.clear());

const DATE = "2026-05-08";

describe("DiaryEditor", () => {
  test("renders the formatted date heading", () => {
    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={() => {}} />);
    expect(screen.getByText(/Friday, May 8, 2026/i)).toBeInTheDocument();
  });

  test("shows placeholder text when no entry and no template", () => {
    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={() => {}} />);
    const textarea = screen.getByPlaceholderText(/Write about your day/i);
    expect(textarea).toBeInTheDocument();
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  test("pre-fills template content for a new entry", () => {
    store["diary_template"] = "# Morning\n\n# Evening";
    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={() => {}} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("# Morning\n\n# Evening");
  });

  test("saves entry and calls onSave", () => {
    const onSave = jest.fn();
    render(<DiaryEditor date={DATE} onSave={onSave} onDelete={() => {}} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Today was great" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(store["diary_entries"]).toContain("Today was great");
  });

  test("shows Delete button after an entry exists", () => {
    store["diary_entries"] = JSON.stringify({
      [DATE]: { content: "Existing entry", updatedAt: "2026-05-08T10:00:00.000Z" },
    });
    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={() => {}} />);
    expect(screen.getByText(/Delete entry/i)).toBeInTheDocument();
  });

  test("requires confirmation before deleting", () => {
    store["diary_entries"] = JSON.stringify({
      [DATE]: { content: "Entry to delete", updatedAt: "2026-05-08T10:00:00.000Z" },
    });
    const onDelete = jest.fn();
    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByText(/Delete entry/i));
    expect(screen.getByText(/Confirm delete/i)).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(/Confirm delete/i));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test("cancel aborts delete", () => {
    store["diary_entries"] = JSON.stringify({
      [DATE]: { content: "Keep me", updatedAt: "2026-05-08T10:00:00.000Z" },
    });
    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={() => {}} />);
    fireEvent.click(screen.getByText(/Delete entry/i));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText(/Confirm delete/i)).toBeNull();
    expect(store["diary_entries"]).toContain("Keep me");
  });
});
