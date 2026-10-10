"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Shield, ArrowRight } from "lucide-react";
import { LANDING_CONFIG, type PricingTier } from "@/config/landing";

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "semester">(
    "semester",
  );

  function handleToggle(period: "monthly" | "semester") {
    setBillingPeriod(period);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("facultyos:analytics", {
          detail: { event: "pricing_toggle", period },
        }),
      );
    }
  }

  return (
    <div id="pricing" className="space-y-10 scroll-mt-24">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 glass-badge px-3 py-1 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Transparent Faculty Pricing</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Predictable Pricing for Professors & Departments
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          1 course free forever. Upgrade whenever you need multiple courses, teaching assistant delegation, or institutional audit reports.
        </p>

        {/* Billing Toggle (Monthly / Semester) */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <div className="p-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] inline-flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => handleToggle("monthly")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                billingPeriod === "monthly"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => handleToggle("semester")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                billingPeriod === "semester"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>Semester Pass</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full">
                Save 16%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        {LANDING_CONFIG.pricing.tiers.map((tier: PricingTier) => {
          const displayPrice =
            tier.id === "tier-pro" && billingPeriod === "semester"
              ? "₹1,499"
              : tier.priceMonthly;

          const displaySubtext =
            tier.id === "tier-pro" && billingPeriod === "semester"
              ? "per semester (5 months)"
              : tier.billingNote;

          return (
            <div
              key={tier.id}
              className={`rounded-3xl p-7 flex flex-col justify-between transition-all relative ${
                tier.isPopular
                  ? "card-neu ring-2 ring-[var(--accent-primary)] shadow-xl bg-[var(--bg-surface-elevated)]"
                  : "card-neu bg-[var(--bg-surface)]"
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="glass-badge font-bold text-[10px] tracking-wider uppercase px-3 py-1 shadow-md">
                    Most Popular for Faculty
                  </span>
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {tier.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] min-h-[32px]">
                    {tier.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-neu-card)]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                      {displayPrice}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {displaySubtext}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                    Included Capabilities
                  </span>
                  <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--border-neu-card)]">
                <Link
                  href={tier.ctaHref}
                  className={`w-full py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 ${
                    tier.isPopular ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  <span>{tier.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Reversal Banner */}
      <div className="text-center pt-2">
        <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>{LANDING_CONFIG.pricing.riskReversal}</span>
        </p>
      </div>
    </div>
  );
}
