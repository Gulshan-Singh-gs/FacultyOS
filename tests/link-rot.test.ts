import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LANDING_CONFIG } from "@/config/landing";

describe("Link Rot & Internal Routing Integrity (L12)", () => {
  const rootDir = process.cwd();

  it("verifies all footer and announcement links are valid targets", () => {
    const allLinks: string[] = [
      LANDING_CONFIG.announcement.ctaHref,
      LANDING_CONFIG.hero.primaryCta.href,
      LANDING_CONFIG.hero.secondaryCta.href,
      ...LANDING_CONFIG.footerColumns.flatMap((col) =>
        col.links.map((l) => l.href),
      ),
      ...LANDING_CONFIG.pricing.tiers.map((t) => t.ctaHref),
    ];

    expect(allLinks.length).toBeGreaterThan(10);

    for (const href of allLinks) {
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) {
        // Valid anchor, mailto, or external link
        continue;
      }

      // Must be a known internal route
      const cleanPath = href.split("?")[0].replace(/^\//, "");
      if (cleanPath === "" || cleanPath === "llms.txt" || cleanPath === "llms-full.txt") {
        continue;
      }

      // Check if page or public file exists (including Next.js route groups like (auth) and (dashboard))
      const pageFile = path.join(rootDir, "src", "app", cleanPath, "page.tsx");
      const authPageFile = path.join(rootDir, "src", "app", "(auth)", cleanPath, "page.tsx");
      const dashboardPageFile = path.join(rootDir, "src", "app", "(dashboard)", cleanPath, "page.tsx");
      const directFile = path.join(rootDir, "src", "app", `${cleanPath}.tsx`);
      const publicFile = path.join(rootDir, "public", cleanPath);

      const exists =
        fs.existsSync(pageFile) ||
        fs.existsSync(authPageFile) ||
        fs.existsSync(dashboardPageFile) ||
        fs.existsSync(directFile) ||
        fs.existsSync(publicFile);

      expect(
        exists,
        `Expected internal link target "${href}" to exist at "${pageFile}" or in public/`,
      ).toBe(true);
    }
  });

  it("verifies public LLMs and pricing markdown mirrors exist", () => {
    expect(fs.existsSync(path.join(rootDir, "public", "llms.txt"))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, "public", "llms-full.txt"))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, "public", "pricing.md"))).toBe(true);
  });
});
