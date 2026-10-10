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

// 0. Pre-patch OpenNext load-manifest plugin to support Next.js 16 Turbopack preview-props.json
try {
  const loadManifestPluginPath = path.resolve(
    "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js"
  );
  if (fs.existsSync(loadManifestPluginPath)) {
    let content = fs.readFileSync(loadManifestPluginPath, "utf-8");
    if (!content.includes("preview-props")) {
      content = content.replace(
        "{*-manifest,required-server-files,prefetch-hints}.json",
        "{*-manifest,required-server-files,prefetch-hints,preview-props}.json"
      );
      content = content.replace(
        'p.endsWith("prefetch-hints")',
        'p.endsWith("prefetch-hints") || p.endsWith("preview-props")'
      );
      fs.writeFileSync(loadManifestPluginPath, content, "utf-8");
      console.log("✓ Pre-patched OpenNext load-manifest plugin for preview-props.json support");
    }
  }
} catch (e) {
  console.warn("⚠️ Warning during load-manifest plugin pre-patch:", e);
}

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

  // 1. Ensure assets directory is clean for Cloudflare Workers with Assets deployment
  if (fs.existsSync(assetsDir)) {
    const legacyWorker = path.join(assetsDir, "_worker.js");
    if (fs.existsSync(legacyWorker)) {
      fs.rmSync(legacyWorker, { force: true });
      console.log("✓ Removed legacy _worker.js from assets directory");
    }
    const legacyRoutes = path.join(assetsDir, "_routes.json");
    if (fs.existsSync(legacyRoutes)) {
      fs.rmSync(legacyRoutes, { force: true });
      console.log("✓ Removed legacy _routes.json from assets directory");
    }
    // Write .assetsignore to ensure Wrangler never attempts to upload worker/map files
    fs.writeFileSync(
      path.join(assetsDir, ".assetsignore"),
      "_worker.js\n_routes.json\n*.map\n",
      "utf-8"
    );
    console.log("✓ Configured .assetsignore in assets directory");
  }

  // 4. Post-patch all built worker and handler files in .open-next to ensure unexpected loadManifest doesn't crash
  function patchFilesRecursively(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        patchFilesRecursively(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".mjs"))) {
        let code = fs.readFileSync(fullPath, "utf-8");
        let modified = false;
        if (code.includes("Unexpected loadManifest")) {
          // Prevent crashes on preview-props.json or any un-inlined manifest
          const loadManifestRegex = new RegExp(
            "throw new Error\\([\\x60\\x22\\x27]Unexpected loadManifest[\\s\\S]*?\\);",
            "g"
          );
          code = code.replace(
            loadManifestRegex,
            'if ($PATH && ($PATH.endsWith("preview-props.json") || $PATH.endsWith("preview-props"))) { return {}; } return {};'
          );
          modified = true;
        }
        if (modified) {
          fs.writeFileSync(fullPath, code, "utf-8");
          console.log(`✓ Post-patched ${path.relative(process.cwd(), fullPath)} for loadManifest resilience`);
        }
      }
    }
  }
  patchFilesRecursively(openNextDir);
} catch (err) {
  if (isWindows && !process.env.CF_PAGES) {
    console.warn("⚠️ OpenNext encountered Windows local symlink limitation. Running standard next build for local validation.");
    execSync("npx next build", { stdio: "inherit" });
  } else {
    throw err;
  }
}

console.log("=== FacultyOS Build Completed Successfully ===");
