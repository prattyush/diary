import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
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
    fireEvent.click(screen.getByText("Edit"));
    const textarea = screen.getByPlaceholderText(/Write about your day/i);
    expect(textarea).toBeInTheDocument();
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  test("pre-fills template content for a new entry", () => {
    store["diary_template"] = "# Morning\n\n# Evening";
    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={() => {}} />);
    fireEvent.click(screen.getByText("Edit"));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("# Morning\n\n# Evening");
  });

  test("saves entry and calls onSave", () => {
    const onSave = jest.fn();
    render(<DiaryEditor date={DATE} onSave={onSave} onDelete={() => {}} />);
    fireEvent.click(screen.getByText("Edit"));
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

  test("shows Add photo button in edit mode", () => {
    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={() => {}} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText(/Add photo/i)).toBeInTheDocument();
  });

  test("shows image thumbnail in view mode when entry has an image", () => {
    store["diary_entries"] = JSON.stringify({
      [DATE]: { content: "Photo day", updatedAt: "2026-05-08T10:00:00.000Z", image: "data:image/png;base64,abc" },
    });
    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={() => {}} />);
    const img = screen.getByAltText("Diary photo");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "data:image/png;base64,abc");
  });

  test("attaches image via FileReader and saves it", async () => {
    const onSave = jest.fn();
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";

    // Mock FileReader
    const mockReadAsDataURL = jest.fn();
    const mockFileReader = {
      readAsDataURL: mockReadAsDataURL,
      result: dataUrl,
      onload: null as ((e: Event) => void) | null,
    };
    jest.spyOn(globalThis, "FileReader" as keyof typeof globalThis).mockImplementation(
      () => mockFileReader as unknown as FileReader
    );

    render(<DiaryEditor date={DATE} onSave={onSave} onDelete={() => {}} />);
    fireEvent.click(screen.getByText("Edit"));

    const file = new File(["img"], "photo.png", { type: "image/png" });
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // Trigger the FileReader onload callback
    act(() => {
      if (mockFileReader.onload) mockFileReader.onload({} as Event);
    });

    await waitFor(() => expect(screen.getByAltText("Attached")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(store["diary_entries"]).toContain(dataUrl);

    jest.restoreAllMocks();
  });

  test("remove image button clears the preview in edit mode", async () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: dataUrl,
      onload: null as ((e: Event) => void) | null,
    };
    jest.spyOn(globalThis, "FileReader" as keyof typeof globalThis).mockImplementation(
      () => mockFileReader as unknown as FileReader
    );

    render(<DiaryEditor date={DATE} onSave={() => {}} onDelete={() => {}} />);
    fireEvent.click(screen.getByText("Edit"));

    const file = new File(["img"], "photo.png", { type: "image/png" });
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    act(() => { if (mockFileReader.onload) mockFileReader.onload({} as Event); });

    await waitFor(() => expect(screen.getByAltText("Attached")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Remove image"));
    expect(screen.queryByAltText("Attached")).toBeNull();
    expect(screen.getByText(/Add photo/i)).toBeInTheDocument();

    jest.restoreAllMocks();
  });
});
