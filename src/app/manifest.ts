import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FacultyOS — Operations Platform for Professors",
    short_name: "FacultyOS",
    description:
      "Automate student requests, enforce syllabus policies, protect your time, and document your career.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
