import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://facultyos.com"),
  title: {
    default: "FacultyOS — Automate Student Requests & Protect Your Time",
    template: "%s | FacultyOS",
  },
  description:
    "FacultyOS turns course syllabi into deterministic policy engines that triage extensions, regrades, and meetings instantly. Start free for 1 course forever.",
  keywords: [
    "FacultyOS",
    "syllabus policy engine",
    "student request triage",
    "higher ed automation",
    "regrade defense",
    "faculty workload manager",
    "FERPA compliant grading",
  ],
  authors: [{ name: "FacultyOS Team" }],
  creator: "FacultyOS",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://facultyos.com",
    title: "FacultyOS — Automate Student Requests & Protect Your Time",
    description:
      "Deterministic syllabus rules that triage student extensions, regrades, and meetings instantly with zero medical data collection.",
    siteName: "FacultyOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "FacultyOS — Automate Student Requests & Protect Your Time",
    description:
      "Deterministic syllabus rules that triage student extensions, regrades, and meetings instantly with zero medical data collection.",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
};

import { ThemeProvider } from "@/components/theme/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      data-theme="dark"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("facultyos_theme")||"dark";if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.classList.add("light");document.documentElement.setAttribute("data-theme","light");}else{document.documentElement.classList.remove("light");document.documentElement.classList.add("dark");document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
