"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourseAction } from "@/server/actions/courses";

interface CreateCourseDialogProps {
  canCreate: boolean;
  planName: string;
}

export function CreateCourseDialog({ canCreate, planName }: CreateCourseDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [term, setTerm] = useState("Fall 2026");
  const [syllabusText, setSyllabusText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPortalToken, setNewPortalToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await createCourseAction({
      courseCode,
      courseName,
      term,
      syllabusText: syllabusText || undefined,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setNewPortalToken(res.data.rawToken);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={!canCreate}
        className="btn-primary px-4 py-2 text-sm font-medium"
      >
        + Create Course
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Create New Course
                </h2>
                <div className="text-[11px] text-[var(--text-secondary)] capitalize">
                  Plan: {planName}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setNewPortalToken(null);
                  setError(null);
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
              >
                ✕
              </button>
            </div>

            {newPortalToken ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm space-y-2">
                  <div className="font-bold">Course Created Successfully!</div>
                  <p className="text-xs">
                    Your student portal link is ready. Share this link on your syllabus or LMS:
                  </p>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-input)] font-mono text-xs text-[var(--text-primary)] select-all break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/c/${newPortalToken}`
                      : `/c/${newPortalToken}`}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setNewPortalToken(null);
                    router.refresh();
                  }}
                  className="w-full btn-primary py-2.5 text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                      Course Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS301"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 input-neu text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                      Term
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fall 2026"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full px-3.5 py-2.5 input-neu text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Course Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Database Systems"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full px-3.5 py-2.5 input-neu text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Syllabus Text (Optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Paste relevant syllabus policies (late submission rules, extension deadlines)..."
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    className="w-full px-3.5 py-2.5 input-neu text-sm resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-ghost px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-5 py-2.5 text-sm font-semibold"
                  >
                    {loading ? "Creating..." : "Create Course"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
