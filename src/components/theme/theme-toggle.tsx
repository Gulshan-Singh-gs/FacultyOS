"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function ThemeToggle({
  className = "",
  size = "sm",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn--outline ${
        size === "sm" ? "btn--sm" : "btn--md"
      } px-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform hover:rotate-45" />
          {showLabel && (
            <span className="text-[11px] font-medium text-slate-300">Light</span>
          )}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-500 transition-transform hover:-rotate-12" />
          {showLabel && (
            <span className="text-[11px] font-medium text-slate-700">Dark</span>
          )}
        </>
      )}
    </button>
  );
}
