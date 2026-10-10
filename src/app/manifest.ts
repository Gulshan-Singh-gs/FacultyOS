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
    background_color: "#F4F6FB",
    theme_color: "#6366F1",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
