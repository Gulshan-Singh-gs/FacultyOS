"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

export interface CategoryCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  isActive?: boolean;
  onClick: () => void;
}

export function CategoryCard({
  id,
  title,
  subtitle,
  icon: Icon,
  isActive = false,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      role="gridcell"
      aria-label={`${title}: ${subtitle}`}
      onClick={onClick}
      className={`group flex flex-col items-center p-2 rounded-3xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 cursor-pointer ${
        isActive ? "opacity-100" : "opacity-90 hover:opacity-100"
      }`}
      id={`category-card-${id}`}
    >
      {/* Neumorphic Circular Container */}
      <div
        className={`category-circle w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] ${
          isActive ? "gradient-border" : ""
        }`}
      >
        <Icon
          size={32}
          strokeWidth={1.5}
          className="text-neutral-900 dark:text-neutral-100 transition-transform duration-150 group-hover:scale-110"
        />
      </div>

      {/* Label and Subtitle */}
      <span className="font-semibold text-center text-sm sm:text-base text-[var(--text-primary)] mt-3">
        {title}
      </span>
      <span className="text-xs sm:text-sm text-[var(--text-muted)] text-center mt-0.5 max-w-[160px]">
        {subtitle}
      </span>
    </button>
  );
}
