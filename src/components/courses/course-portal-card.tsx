"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { rotateCourseTokenAction, archiveCourseAction } from "@/server/actions/courses";

interface CoursePortalCardProps {
  courseId: string;
  courseCode: string;
  courseStatus: string;
}

export function CoursePortalCard({
  courseId,
  courseCode,
  courseStatus,
}: CoursePortalCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newRawToken, setNewRawToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const portalUrl = newRawToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/c/${newRawToken}`
    : `(Configured via access token)`;

  const handleCopy = () => {
    if (newRawToken) {
      navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRotate = async () => {
    if (
      !confirm(
        "Are you sure you want to rotate the access token? Any previous link shared with students will immediately stop working.",
      )
    ) {
      return;
    }

    setRotating(true);
    setError(null);
    setMessage(null);

    const res = await rotateCourseTokenAction({ courseId });
    setRotating(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setNewRawToken(res.data.rawToken);
    setMessage("Access token rotated successfully! Copy the new link below.");
    router.refresh();
  };

  const handleArchive = async () => {
    if (
      !confirm(
        `Are you sure you want to archive ${courseCode}? It will no longer count against your active course limit and students will not be able to submit requests.`,
      )
    ) {
      return;
    }

    const res = await archiveCourseAction({ courseId });
    if (!res.success) {
      setError(res.error);
      return;
    }

    router.push("/courses");
    router.refresh();
  };

  return (
    <div className="card-neu p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Student Intake Portal
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Students submit extension, regrade, and absence requests through this link. No student accounts needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {courseStatus === "active" && (
            <button
              onClick={handleArchive}
              className="btn-ghost text-xs px-3 py-1.5 text-red-500 hover:text-red-600"
            >
              Archive Course
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          {message}
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Portal Access Link
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            readOnly
            value={
              newRawToken
                ? portalUrl
                : "Token hash is active. Click 'Rotate Access Token' to view or generate a fresh link."
            }
            className="flex-1 px-4 py-2.5 input-neu text-xs font-mono select-all"
          />
          {newRawToken && (
            <button
              onClick={handleCopy}
              className="btn-primary px-4 py-2.5 text-xs font-semibold whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-[var(--text-secondary)]">
        <p>
          Need to revoke student access? Rotating the token immediately invalidates the old link.
        </p>
        <button
          onClick={handleRotate}
          disabled={rotating}
          className="btn-secondary px-4 py-2 text-xs font-medium whitespace-nowrap self-start sm:self-auto"
        >
          {rotating ? "Rotating..." : "Rotate Access Token"}
        </button>
      </div>
    </div>
  );
}
