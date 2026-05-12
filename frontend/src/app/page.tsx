"use client";

import { useState, useEffect, useCallback } from "react";
import Calendar from "@/components/Calendar";
import DiaryEditor from "@/components/DiaryEditor";
import TemplateEditor from "@/components/TemplateEditor";
import { getDatesWithEntries } from "@/lib/storage";

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(new Set());
  const [showTemplate, setShowTemplate] = useState(false);

  const refreshEntries = useCallback(() => {
    setDatesWithEntries(new Set(getDatesWithEntries()));
  }, []);

  useEffect(() => {
    setSelectedDate(todayString());
    refreshEntries();
  }, [refreshEntries]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📔</span>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Diary</h1>
          </div>
          <button
            onClick={() => setShowTemplate(true)}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            ✏️ Template
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="flex flex-col md:flex-row gap-6 h-full">
          {/* Calendar panel */}
          <div className="md:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                datesWithEntries={datesWithEntries}
              />
              <p className="mt-5 text-xs text-gray-400 text-center">
                {datesWithEntries.size} {datesWithEntries.size === 1 ? "entry" : "entries"} saved
              </p>
            </div>
          </div>

          {/* Editor panel */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[480px] flex flex-col">
            {selectedDate ? (
              <DiaryEditor
                key={selectedDate}
                date={selectedDate}
                onSave={refreshEntries}
                onDelete={refreshEntries}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
                Select a day to start writing
              </div>
            )}
          </div>
        </div>
      </main>

      {showTemplate && (
        <TemplateEditor
          onClose={() => setShowTemplate(false)}
        />
      )}
    </div>
  );
}
