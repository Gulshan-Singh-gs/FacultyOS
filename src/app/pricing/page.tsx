import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Pricing — FacultyOS",
  description:
    "Transparent pricing for university faculty. Free forever for 1 course. Pro at ₹299/month or ₹1,499/semester.",
  alternates: {
    canonical: "https://facultyos.com/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] px-4 sm:px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-16">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <PricingSection />
        </div>

        <div className="pt-10 border-t border-[var(--border-neu-card)]">
          <FaqAccordion />
        </div>
      </div>
    </div>
  );
}
