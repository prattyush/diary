"use client";

import { useState, useEffect, useRef } from "react";
import { getEntry, saveEntry, deleteEntry, getTemplate } from "@/lib/storage";

interface DiaryEditorProps {
  date: string;
  onSave: () => void;
  onDelete: () => void;
}

function formatDisplayDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD; add T00:00:00 to avoid timezone shift
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DiaryEditor({ date, onSave, onDelete }: DiaryEditorProps) {
  const [content, setContent] = useState("");
  const [hasEntry, setHasEntry] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const existing = getEntry(date);
    if (existing) {
      setContent(existing.content);
      setHasEntry(true);
    } else {
      setContent(getTemplate());
      setHasEntry(false);
    }
    setSaveStatus("idle");
    setConfirmDelete(false);
    textareaRef.current?.focus();
  }, [date]);

  const handleSave = () => {
    saveEntry(date, content);
    setHasEntry(content.trim() !== "");
    setSaveStatus("saved");
    onSave();
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteEntry(date);
    setContent(getTemplate());
    setHasEntry(false);
    setConfirmDelete(false);
    onDelete();
  };

  const isDirty = hasEntry
    ? content !== (getEntry(date)?.content ?? "")
    : content.trim() !== "" && content !== getTemplate();

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Date heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{formatDisplayDate(date)}</h2>
        {isDirty && <span className="text-xs text-amber-500">Unsaved changes</span>}
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setSaveStatus("idle");
        }}
        placeholder="Write about your day…"
        className="flex-1 w-full p-4 rounded-xl border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 text-sm leading-relaxed placeholder:text-gray-300 bg-white"
      />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saveStatus === "saved" ? "Saved ✓" : "Save"}
        </button>

        {hasEntry && !confirmDelete && (
          <button
            onClick={handleDelete}
            className="px-5 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete entry
          </button>
        )}

        {confirmDelete && (
          <>
            <button
              onClick={handleDelete}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
