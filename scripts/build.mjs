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

  // 1. Generate Cloudflare Pages compatible _worker.js
  if (fs.existsSync(workerPath)) {
    const wrappedWorker = `import { handleCdnCgiImageRequest, handleImageRequest } from "./cloudflare/images.js";
import { runWithCloudflareRequestContext } from "./cloudflare/init.js";
import { maybeGetSkewProtectionResponse } from "./cloudflare/skew-protection.js";
import { handler as middlewareHandler } from "./middleware/handler.mjs";

export default {
  async fetch(request, env, ctx) {
    try {
      return await runWithCloudflareRequestContext(request, env, ctx, async () => {
        const response = maybeGetSkewProtectionResponse(request);
        if (response) {
          return response;
        }
        const url = new URL(request.url);
        if (url.pathname.startsWith("/cdn-cgi/image/")) {
          return handleCdnCgiImageRequest(url, env);
        }
        if (url.pathname === \`\${globalThis.__NEXT_BASE_PATH__ || ""}/_next/image\${globalThis.__TRAILING_SLASH__ ? "/" : ""}\`) {
          return await handleImageRequest(url, request.headers, env);
        }
        const reqOrResp = await middlewareHandler(request, env, ctx);
        if (reqOrResp instanceof Response) {
          return reqOrResp;
        }
        const { handler } = await import("./server-functions/default/handler.mjs");
        const res = await handler(reqOrResp, env, ctx, request.signal);
        if (res.status >= 500 && request.method === "GET" && env?.ASSETS?.fetch) {
          try {
            const assetRes = await env.ASSETS.fetch(request);
            if (assetRes && assetRes.status < 400) {
              return assetRes;
            }
          } catch (e) {
            console.error("[Fallback to ASSETS error]", e);
          }
        }
        return res;
      });
    } catch (err) {
      console.error("[FacultyOS Worker Runtime Exception]", err);
      // Fallback: In Cloudflare Pages, attempt to serve the static asset if available
      if (env?.ASSETS?.fetch && request.method === "GET") {
        try {
          const assetRes = await env.ASSETS.fetch(request);
          if (assetRes && assetRes.status < 400) {
            return assetRes;
          }
        } catch {}
      }
      return new Response(
        \`FacultyOS Worker Exception:\\n\${err?.stack || err?.message || String(err)}\\n\\nURL: \${request.url}\\nMethod: \${request.method}\`,
        {
          status: 500,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }
  },
};
`;

    if (fs.existsSync(assetsDir)) {
      fs.writeFileSync(path.join(assetsDir, "_worker.js"), wrappedWorker, "utf-8");
      console.log("✓ Created .open-next/assets/_worker.js with Pages error handler");
    }
    fs.writeFileSync(path.join(openNextDir, "_worker.js"), wrappedWorker, "utf-8");
    console.log("✓ Created .open-next/_worker.js with Pages error handler");
  }

  // 2. Generate _routes.json so Cloudflare Pages routes dynamic paths to worker and serves static pages directly from edge CDN
  const routesJson = {
    version: 1,
    include: [
      "/api/*",
      "/r/*",
      "/c/*",
      "/dashboard*",
      "/inbox*",
      "/courses*",
      "/ledger*",
      "/boundaries*",
      "/requests/*",
    ],
    exclude: [
      "/_next/static/*",
      "/favicon.ico",
      "/favicon.svg",
      "/icon.svg",
      "/robots.txt",
      "/sitemap.xml",
      "/manifest.webmanifest",
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
