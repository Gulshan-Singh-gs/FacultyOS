"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { LANDING_CONFIG, type FAQItem } from "@/config/landing";

export function FaqAccordion() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    "faq-what-is": true,
    "faq-medical": true,
  });

  function toggle(id: string, question: string) {
    setOpenIds((prev) => {
      const willOpen = !prev[id];
      if (willOpen && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("facultyos:analytics", {
            detail: { event: "faq_open", question },
          }),
        );
      }
      return { ...prev, [id]: willOpen };
    });
  }

  return (
    <div id="faq" className="space-y-8 scroll-mt-24">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 glass-badge px-3 py-1 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Everything You Need to Know About FacultyOS
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Clear, direct answers to common questions about student privacy, policy automation, ERP coexistence, and pricing.
        </p>
      </div>

      {/* Accordion List */}
      <div className="max-w-3xl mx-auto space-y-3.5">
        {LANDING_CONFIG.faqs.map((faq: FAQItem) => {
          const isOpen = Boolean(openIds[faq.id]);
          return (
            <div
              key={faq.id}
              className="card-neu overflow-hidden transition-all border border-[var(--border-neu-card)]"
            >
              <button
                type="button"
                id={`accordion-btn-${faq.id}`}
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${faq.id}`}
                onClick={() => toggle(faq.id, faq.question)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[var(--accent-primary)]" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div
                  id={`accordion-panel-${faq.id}`}
                  role="region"
                  aria-labelledby={`accordion-btn-${faq.id}`}
                  className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-neu-card)]/40"
                >
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
