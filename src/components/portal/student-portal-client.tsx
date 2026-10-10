"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react";
import { MedicalBoundaryBanner } from "./medical-boundary-banner";
import { CategoryExplorer } from "./category-explorer";
import {
  RequestTypeCards,
  type RequestTypeKey,
  REQUEST_TYPE_CONFIG,
} from "./request-type-cards";
import { IntakeStepperForm, type RequestType } from "./intake-stepper-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export interface StudentPortalCourseData {
  courseCode: string;
  courseName: string;
  term: string;
  syllabusText?: string | null;
  professorName: string | null;
  institution: string | null;
  facultyTitle: string | null;
  activePolicyTypes: string[];
}

interface StudentPortalClientProps {
  courseToken: string;
  course: StudentPortalCourseData;
}

export function StudentPortalClient({
  courseToken,
  course,
}: StudentPortalClientProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("highlights");
  const [activeRequestTypeFilter, setActiveRequestTypeFilter] = useState<string | null>(null);
  const [selectedFormType, setSelectedFormType] = useState<RequestType | null>(null);

  const handleSelectCategory = (categoryId: string, mappedRequestType?: string) => {
    setActiveCategoryId(categoryId);
    if (!mappedRequestType || mappedRequestType === "all") {
      setActiveRequestTypeFilter(null);
    } else {
      setActiveRequestTypeFilter(mappedRequestType);
    }
  };

  const handleStartRequest = (type: RequestTypeKey) => {
    setSelectedFormType(type as RequestType);
    // Smooth scroll to form on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] px-4 py-8 sm:py-12 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Portal Header with Theme Toggle */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <span className="font-bold text-[var(--text-primary)] tracking-tight">FacultyOS</span>
            <span>•</span>
            <span>Student Request Portal</span>
          </div>
          <ThemeToggle size="sm" showLabel />
        </div>

        {/* Top-Level Medical Boundary Banner (Hard Rule 1) */}
        <MedicalBoundaryBanner />

        {/* If Form is Active: Show Stepper Form */}
        {selectedFormType ? (
          <IntakeStepperForm
            courseToken={courseToken}
            courseCode={course.courseCode}
            courseName={course.courseName}
            initialRequestType={selectedFormType}
            onCancel={() => setSelectedFormType(null)}
          />
        ) : (
          <>
            {/* Course Header Banner */}
            <div className="card-neu p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[var(--border-neu-card)]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="glass-badge font-bold text-xs">
                    {course.courseCode}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{course.term}</span>
                  </span>
                  {course.institution && (
                    <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
                      • {course.institution}
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                    {course.courseName}
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>
                      {course.facultyTitle || "Instructor"}:{" "}
                      <strong>{course.professorName || "Course Faculty"}</strong>
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick Action Prompt */}
              <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] text-xs space-y-1.5 shrink-0 sm:max-w-[240px]">
                <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>Student Self-Service</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Submit requests evaluated directly against the published course syllabus.
                </p>
              </div>
            </div>

            {/* Policy Summary Band */}
            <div className="p-4 rounded-2xl glass-panel border border-[var(--border-neu-card)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Deterministic SLA
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Instant rule decisions or &lt;48h triage
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Protected Privacy
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    No doctor notes or health data accepted
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Syllabus-Aligned
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Evaluated with objective criteria
                  </div>
                </div>
              </div>
            </div>

            {/* Category Explorer Section (Screen 7 NeuGlass Design) */}
            <CategoryExplorer
              activeCategoryId={activeCategoryId}
              onSelectCategory={handleSelectCategory}
            />

            {/* Filter Notice when Category is Filtered */}
            {activeRequestTypeFilter && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] border border-[var(--border-neu-card)]">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>
                    Filtered by category:{" "}
                    <strong className="text-[var(--text-primary)] uppercase">
                      {activeRequestTypeFilter}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRequestTypeFilter(null);
                    setActiveCategoryId("highlights");
                  }}
                  className="font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                >
                  Show All Types
                </button>
              </div>
            )}

            {/* Request Type Cards Section */}
            <section className="space-y-4" aria-label="Course Request Types">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    What do you need assistance with?
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Select a structured workflow to submit your request in under 90 seconds.
                  </p>
                </div>
                <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
                  {REQUEST_TYPE_CONFIG.length} Available Types
                </span>
              </div>

              {/* Grid of Cards */}
              <RequestTypeCards
                selectedType={null}
                onSelectType={handleStartRequest}
              />
            </section>

            {/* Direct Quick-Action Bar for Mobile Speed (<90s acceptance) */}
            <div className="card-neu-sm p-4 text-center sm:hidden flex items-center justify-between gap-3">
              <div className="text-left">
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  Need a quick extension?
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Ready in under 90 seconds
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartRequest("extension")}
                className="btn-primary text-xs px-4 py-2 font-semibold inline-flex items-center gap-1 shrink-0"
              >
                <span>Start Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
