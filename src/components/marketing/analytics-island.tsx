"use client";

import { useEffect, useRef } from "react";

interface PostHogClient {
  capture: (event: string, properties?: Record<string, unknown>) => void;
}

interface WindowWithPostHog extends Window {
  posthog?: PostHogClient;
}

export function AnalyticsIsland() {
  const trackedDepths = useRef<Set<number>>(new Set());

  useEffect(() => {
    // 1. UTM persistence
    try {
      const params = new URLSearchParams(window.location.search);
      const utms: Record<string, string> = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(
        (key) => {
          const val = params.get(key);
          if (val) utms[key] = val;
        },
      );
      if (Object.keys(utms).length > 0) {
        sessionStorage.setItem("facultyos_utms", JSON.stringify(utms));
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }

    // 2. Custom Event Listener for Simulator / FAQ / CTAs
    function handleCustomEvent(e: Event) {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      const win = window as unknown as WindowWithPostHog;
      if (typeof window !== "undefined" && win.posthog) {
        win.posthog.capture(detail.event, detail);
      }
    }

    window.addEventListener("facultyos:analytics", handleCustomEvent);

    // 3. Scroll depth tracker (25%, 50%, 75%, 100%)
    function handleScroll() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.round((window.scrollY / docHeight) * 100);

      [25, 50, 75, 100].forEach((threshold) => {
        if (scrollPercent >= threshold && !trackedDepths.current.has(threshold)) {
          trackedDepths.current.add(threshold);
          const win = window as unknown as WindowWithPostHog;
          if (typeof window !== "undefined" && win.posthog) {
            win.posthog.capture("scroll_depth", { depth: threshold });
          }
        }
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("facultyos:analytics", handleCustomEvent);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return null;
}
