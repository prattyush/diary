"use client";

import { useState, useEffect } from "react";
import { getTemplate, saveTemplate } from "@/lib/storage";

interface TemplateEditorProps {
  onClose: () => void;
}

export default function TemplateEditor({ onClose }: TemplateEditorProps) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(getTemplate());
  }, []);

  const handleSave = () => {
    saveTemplate(content);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setContent("");
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">Daily Template</h2>
            <p className="text-xs text-gray-400 mt-0.5">Applied when you open a blank day</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Editor */}
        <div className="p-6">
          <textarea
            className="w-full h-56 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-mono text-gray-700 placeholder:text-gray-300"
            placeholder={"# Morning thoughts\n\n# Highlights\n\n# Gratitude\n\n# Tomorrow"}
            value={content}
            onChange={(e) => { setContent(e.target.value); setSaved(false); }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear template
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {saved ? "Saved ✓" : "Save template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
