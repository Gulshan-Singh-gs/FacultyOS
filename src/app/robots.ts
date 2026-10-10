import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://facultyos.com";

  return {
    rules: [
      // Standard search and citation engines (Permitted)
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "OAI-SearchBot",
          "Claude-SearchBot",
          "PerplexityBot",
          "*",
        ],
        allow: ["/", "/pricing", "/security", "/privacy", "/terms", "/changelog", "/llms.txt"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/inbox/",
          "/courses/",
          "/settings/",
          "/ledger/",
          "/boundaries/",
          "/c/",
          "/r/",
        ],
      },
      // 2026 AI Model Training Scrapers (Disallowed per Privacy-First Architecture)
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "CCBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
