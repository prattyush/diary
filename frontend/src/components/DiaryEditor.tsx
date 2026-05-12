"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [image, setImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [hasEntry, setHasEntry] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  useEffect(() => {
    const existing = getEntry(date);
    if (existing) {
      setContent(existing.content);
      setImage(existing.image ?? null);
      setHasEntry(true);
      setIsEditing(false);
    } else {
      setContent(getTemplate());
      setImage(null);
      setHasEntry(false);
      setIsEditing(false);
    }
    setSaveStatus("idle");
    setConfirmDelete(false);
  }, [date]);

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected after removal
    e.target.value = "";
  }, []);

  const handleSave = () => {
    saveEntry(date, content, image);
    const saved = content.trim() !== "" || !!image;
    setHasEntry(saved);
    setIsEditing(false);
    setSaveStatus("saved");
    onSave();
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleCancel = () => {
    const existing = getEntry(date);
    setContent(existing ? existing.content : getTemplate());
    setImage(existing?.image ?? null);
    setIsEditing(false);
    setConfirmDelete(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteEntry(date);
    setContent(getTemplate());
    setImage(null);
    setHasEntry(false);
    setIsEditing(false);
    setConfirmDelete(false);
    onDelete();
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Date heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{formatDisplayDate(date)}</h2>
        {saveStatus === "saved" && <span className="text-xs text-green-500">Saved ✓</span>}
      </div>

      {isEditing ? (
        <>
          {/* Edit mode */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about your day…"
            className="flex-1 w-full p-4 rounded-xl border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 text-sm leading-relaxed placeholder:text-gray-300 bg-white"
          />
          {/* Image attachment area */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          {image ? (
            <div className="flex items-center gap-3">
              <div className="relative inline-block">
                <img src={image} alt="Attached" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                Change photo
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="self-start px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              📷 Add photo
            </button>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {/* View mode */}
          {hasEntry ? (
            <div className="flex-1 w-full p-4 rounded-xl border border-gray-100 bg-gray-50 text-gray-700 text-sm leading-relaxed overflow-auto whitespace-pre-wrap">
              {content}
              {image && (
                <div className="mt-3">
                  <img
                    src={image}
                    alt="Diary photo"
                    onClick={() => setLightboxOpen(true)}
                    className="h-32 rounded-lg object-cover border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
              No entry for this day yet.
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Edit
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
        </>
      )}
      {lightboxOpen && image && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={image}
            alt="Diary photo full size"
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/40 text-white rounded-full text-lg flex items-center justify-center transition-colors"
            aria-label="Close image"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
