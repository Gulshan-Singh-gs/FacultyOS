import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// ⚠️ RECURSION GUARD:
// When OpenNext runs its "Building Next.js app" phase, it executes the project's "pnpm run build".
// If "build" runs this script, we must build the Next.js app directly and exit, preventing an infinite loop.
if (process.env.OPEN_NEXT_BUILDING_NEXT === "1") {
  console.log("--> OpenNext inner build step: executing Next.js build");
  execSync("npx next build", { stdio: "inherit" });
  process.exit(0);
}

process.env.OPEN_NEXT_BUILDING_NEXT = "1";

console.log("=== Building FacultyOS for Cloudflare Deployment ===");

const isWindows = process.platform === "win32";
const isCloudflare = process.env.CF_PAGES === "1" || process.env.CI === "true" || !isWindows;

try {
  console.log("Executing OpenNext Cloudflare adapter build...");
  try {
    execSync("pnpm exec opennextjs-cloudflare build", { stdio: "inherit" });
  } catch {
    execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });
  }

  const openNextDir = path.resolve(".open-next");
  const assetsDir = path.resolve(".open-next/assets");
  const workerPath = path.resolve(".open-next/worker.js");

  // 1. Ensure _worker.js exists for Cloudflare Pages Advanced Mode
  if (fs.existsSync(workerPath)) {
    if (fs.existsSync(assetsDir)) {
      fs.copyFileSync(workerPath, path.join(assetsDir, "_worker.js"));
      console.log("✓ Created .open-next/assets/_worker.js");
    }
    fs.copyFileSync(workerPath, path.join(openNextDir, "_worker.js"));
    console.log("✓ Created .open-next/_worker.js");
  }

  // 2. Generate _routes.json so Cloudflare Pages knows to route SSR/API to worker and serve static files directly
  const routesJson = {
    version: 1,
    include: ["/*"],
    exclude: [
      "/_next/static/*",
      "/favicon.ico",
      "/favicon.svg",
      "/icon.svg",
      "/robots.txt",
      "/sitemap.xml",
    ],
  };

  if (fs.existsSync(assetsDir)) {
    fs.writeFileSync(
      path.join(assetsDir, "_routes.json"),
      JSON.stringify(routesJson, null, 2),
    );
    console.log("✓ Created .open-next/assets/_routes.json");

    fs.writeFileSync(
      path.join(openNextDir, "_routes.json"),
      JSON.stringify(routesJson, null, 2),
    );
    console.log("✓ Created .open-next/_routes.json");

    // 3. Mirror static assets into .open-next root so whether Pages uses .open-next or .open-next/assets, both work!
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      const src = path.join(assetsDir, file);
      const dest = path.join(openNextDir, file);
      if (!fs.existsSync(dest)) {
        try {
          fs.cpSync(src, dest, { recursive: true });
        } catch {
          // ignore existing or symlinks
        }
      }
    }
    console.log("✓ Mirrored assets into .open-next root directory");
  }
} catch (err) {
  if (isWindows && !process.env.CF_PAGES) {
    console.warn("⚠️ OpenNext encountered Windows local symlink limitation. Running standard next build for local validation.");
    execSync("npx next build", { stdio: "inherit" });
  } else {
    throw err;
  }
}

console.log("=== FacultyOS Build Completed Successfully ===");
