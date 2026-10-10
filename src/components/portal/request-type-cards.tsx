"use client";

import React from "react";
import {
  CalendarClock,
  FileCheck2,
  CalendarX2,
  Users2,
  FileQuestion,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

export type RequestTypeKey =
  | "extension"
  | "regrade"
  | "absence"
  | "meeting"
  | "missing_grade"
  | "other";

export interface RequestTypeCardItem {
  id: RequestTypeKey;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  sla: string;
}

export const REQUEST_TYPE_CONFIG: RequestTypeCardItem[] = [
  {
    id: "extension",
    title: "Deadline Extension",
    badge: "Auto-Policy Eligible",
    description: "Request additional time for an assignment or lab before the deadline.",
    icon: CalendarClock,
    sla: "Instant or <24h",
  },
  {
    id: "regrade",
    title: "Grade Dispute / Regrade",
    badge: "Rubric Required",
    description: "Request reconsideration of points with cited rubric criteria and work quotes.",
    icon: FileCheck2,
    sla: "3-5 work days",
  },
  {
    id: "absence",
    title: "Excused Absence",
    badge: "University Approved",
    description: "Report athletic, cultural, civic, or religious absence with official schedules.",
    icon: CalendarX2,
    sla: "1-2 work days",
  },
  {
    id: "meeting",
    title: "Office Hours / Meeting",
    badge: "Agenda Required",
    description: "Schedule a 1-on-1 consultation with structured agenda and desired outcomes.",
    icon: Users2,
    sla: "1-2 work days",
  },
  {
    id: "missing_grade",
    title: "Missing Grade Inquiry",
    badge: "Gradebook Check",
    description: "Inquire about submitted work or exam score not reflected in the LMS.",
    icon: FileQuestion,
    sla: "1-2 work days",
  },
  {
    id: "other",
    title: "General Policy Inquiry",
    badge: "Course Inquiry",
    description: "General academic request or questions governed by syllabus guidelines.",
    icon: HelpCircle,
    sla: "2-3 work days",
  },
];

interface RequestTypeCardsProps {
  selectedType: RequestTypeKey | null;
  onSelectType: (type: RequestTypeKey) => void;
}

export function RequestTypeCards({
  selectedType,
  onSelectType,
}: RequestTypeCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {REQUEST_TYPE_CONFIG.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedType === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectType(item.id)}
            className={`card-neu p-5 text-left transition-all duration-150 relative group flex flex-col justify-between cursor-pointer border ${
              isSelected
                ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20"
                : "border-[var(--border-neu-card)] hover:border-[var(--accent-primary)]/40 hover:-translate-y-0.5"
            }`}
            id={`request-type-card-${item.id}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-[var(--accent-primary)] text-white"
                      : "bg-[var(--bg-input)] text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)]/10"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <span className="glass-badge text-[10px] font-semibold">
                  {item.badge}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[var(--border-neu-card)]/50 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>SLA: {item.sla}</span>
              <span className="inline-flex items-center gap-1 font-medium text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-transform">
                <span>Start</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
