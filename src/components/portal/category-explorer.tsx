"use client";

import React from "react";
import { Sparkles, Flame, Code2, Trophy } from "lucide-react";
import { CategoryCard } from "./category-card";

export interface CategoryExplorerProps {
  activeCategoryId?: string;
  onSelectCategory: (categoryId: string, mappedRequestType?: string) => void;
}

export interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  mappedRequestType?: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: "highlights",
    title: "All Highlights",
    subtitle: "Overview of all course requests",
    icon: Sparkles,
    mappedRequestType: "all",
  },
  {
    id: "cultural",
    title: "Cultural Fests",
    subtitle: "UTSAV, festivals & cultural absences",
    icon: Flame,
    mappedRequestType: "absence",
  },
  {
    id: "tech",
    title: "Tech & Hackathons",
    subtitle: "Project deadlines & dev competitions",
    icon: Code2,
    mappedRequestType: "extension",
  },
  {
    id: "athletics",
    title: "Athletics & Sports",
    subtitle: "Varsity meets & sports tournaments",
    icon: Trophy,
    mappedRequestType: "absence",
  },
];

export function CategoryExplorer({
  activeCategoryId = "highlights",
  onSelectCategory,
}: CategoryExplorerProps) {
  return (
    <section className="w-full py-4 space-y-6" aria-label="Explore Categories">
      <div className="text-center space-y-1">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--text-muted)]">
          EXPLORE CATEGORIES
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Select a focus area to filter official university feeds &amp; request workflows
        </p>
      </div>

      <div
        role="grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center items-start max-w-4xl mx-auto"
      >
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            id={category.id}
            title={category.title}
            subtitle={category.subtitle}
            icon={category.icon}
            isActive={activeCategoryId === category.id}
            onClick={() => onSelectCategory(category.id, category.mappedRequestType)}
          />
        ))}
      </div>
    </section>
  );
}
