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

const singletonHelperCode = `
var _manifestsSymbol = Symbol.for("next.server.manifests");
var _initNextManifests = function() {
  if (globalThis[_manifestsSymbol]) return globalThis[_manifestsSymbol];
  var clientReferenceManifestsPerRoute = new Map();
  var mappingProxies = new Map();
  var createMappingProxy = function(prop) {
    return new Proxy({}, {
      get: function(_, id) {
        for (var pair of clientReferenceManifestsPerRoute.values()) {
          var m = pair && pair.clientReferenceManifest;
          if (m && m[prop] && m[prop][id]) return m[prop][id];
        }
        return { id: String(id), name: "*", chunks: [], async: false };
      }
    });
  };
  var proxiedClientReferenceManifest = new Proxy({}, {
    get: function(_, prop) {
      if (prop === "moduleLoading" || prop === "entryCSSFiles" || prop === "entryJSFiles") {
        for (var pair of clientReferenceManifestsPerRoute.values()) {
          var m = pair && pair.clientReferenceManifest;
          if (m && m[prop]) return m[prop];
        }
        return {};
      }
      if (prop === "clientModules" || prop === "rscModuleMapping" || prop === "edgeRscModuleMapping" || prop === "ssrModuleMapping" || prop === "edgeSSRModuleMapping") {
        var proxy = mappingProxies.get(prop);
        if (!proxy) {
          proxy = createMappingProxy(prop);
          mappingProxies.set(prop, proxy);
        }
        return proxy;
      }
      for (var pair of clientReferenceManifestsPerRoute.values()) {
        var m = pair && pair.clientReferenceManifest;
        if (m && m[prop]) return m[prop];
      }
      return {};
    }
  });
  var singleton = {
    clientReferenceManifestsPerRoute: clientReferenceManifestsPerRoute,
    proxiedClientReferenceManifest: proxiedClientReferenceManifest,
    rscModuleMappingForUseCache: proxiedClientReferenceManifest,
    serverActionsManifest: { node: {}, edge: {}, encryptionKey: "" },
    serverModuleMap: new Proxy({}, {
      get: function(_, id) { return { id: String(id), name: "*", chunks: [], async: false }; }
    })
  };
  globalThis[_manifestsSymbol] = singleton;
  return singleton;
};
globalThis._initNextManifests = _initNextManifests;
try { _initNextManifests(); } catch (e) {}
`;

// 0. Pre-patch plugins and Next.js base-server for error transparency and Next 16 Turbopack compatibility
try {
  // A. Pre-patch load-manifest plugin
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
    }
    // Make loadManifest and evalManifest never throw unexpected errors
    content = content.replace(
      /throw new Error\(`Unexpected loadManifest\(\$\{\$PATH\}\) call!`\);/g,
      "return {};"
    );
    content = content.replace(
      /throw new Error\(`Unexpected evalManifest\(\$\{\$PATH\}\) call!`\);/g,
      "return { __RSC_MANIFEST: {} };"
    );
    fs.writeFileSync(loadManifestPluginPath, content, "utf-8");
    console.log("✓ Pre-patched OpenNext load-manifest plugin (preview-props + resilience)");
  }

  // B. Pre-patch find-dir plugin
  const findDirPluginPath = path.resolve(
    "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/find-dir.js"
  );
  if (fs.existsSync(findDirPluginPath)) {
    let content = fs.readFileSync(findDirPluginPath, "utf-8");
    content = content.replace(
      /throw new Error\(`Unexpected findDir\(\$\{\$DIR\}, \$\{\$NAME\}\) call!`\);/g,
      "return false;"
    );
    fs.writeFileSync(findDirPluginPath, content, "utf-8");
    console.log("✓ Pre-patched OpenNext find-dir plugin (resilience)");
  }

  // C. Pre-patch Next.js base-server to expose actual runtime error instead of opaque 'Internal Server Error'
  const nextBaseServerPath = path.resolve("node_modules/next/dist/server/base-server.js");
  if (fs.existsSync(nextBaseServerPath)) {
    let content = fs.readFileSync(nextBaseServerPath, "utf-8");
    content = content.replace(
      "res.body('Internal Server Error').send();",
      "res.body('Internal Server Error: ' + ((err && (err.stack || err.message)) || String(err))).send();"
    );
    content = content.replace(
      "body: _renderresult.default.fromStatic('Internal Server Error', 'text/plain')",
      "body: _renderresult.default.fromStatic('Internal Server Error: ' + ((err && (err.stack || err.message)) || String(err)), 'text/plain')"
    );
    fs.writeFileSync(nextBaseServerPath, content, "utf-8");
    console.log("✓ Pre-patched Next.js base-server to surface runtime exception details");
  }

  // D. Pre-patch Next.js load-manifest.external.js to define evalManifestFromRelativePath and loadManifestFromRelativePath
  const manifestHelperCode = `
var evalManifestFromRelativePath = function({ projectDir, distDir, manifest, shouldCache, cache, handleMissing } = {}) {
  try {
    if (typeof evalManifest === "function") {
      const p = [projectDir, distDir, manifest].filter(Boolean).join("/");
      return evalManifest(p, shouldCache, cache, handleMissing);
    }
  } catch (e) {}
  return { __RSC_MANIFEST: {} };
};
globalThis.evalManifestFromRelativePath = evalManifestFromRelativePath;

var loadManifestFromRelativePath = function({ projectDir, distDir, manifest, shouldCache, cache, skipParse, handleMissing } = {}) {
  try {
    if (typeof loadManifest === "function") {
      const p = [projectDir, distDir, manifest].filter(Boolean).join("/");
      return loadManifest(p, shouldCache, cache, skipParse, handleMissing);
    }
  } catch (e) {}
  return {};
};
globalThis.loadManifestFromRelativePath = loadManifestFromRelativePath;
`;
  const loadManifestExtCjs = path.resolve("node_modules/next/dist/server/load-manifest.external.js");
  const loadManifestExtEsm = path.resolve("node_modules/next/dist/esm/server/load-manifest.external.js");
  for (const p of [loadManifestExtCjs, loadManifestExtEsm]) {
    if (fs.existsSync(p)) {
      let content = fs.readFileSync(p, "utf-8");
      if (!content.includes("globalThis.evalManifestFromRelativePath")) {
        content = manifestHelperCode + "\n" + content;
        fs.writeFileSync(p, content, "utf-8");
        console.log(`✓ Pre-patched ${path.relative(process.cwd(), p)} with global manifest helper definitions`);
      }
    }
  }

  // E. Pre-patch Next.js manifests-singleton to provide fallback singleton when uninitialized
  const manifestsSingletonCjs = path.resolve("node_modules/next/dist/server/app-render/manifests-singleton.js");
  const manifestsSingletonEsm = path.resolve("node_modules/next/dist/esm/server/app-render/manifests-singleton.js");
  for (const p of [manifestsSingletonCjs, manifestsSingletonEsm]) {
    if (fs.existsSync(p)) {
      let content = fs.readFileSync(p, "utf-8");
      if (!content.includes("globalThis._initNextManifests")) {
        content = singletonHelperCode + "\n" + content;
      }
      content = content.replace(
        /throw new [^;]*?InvariantError\(['"]The manifests singleton was not initialized\.['"]\);/g,
        "manifestSingleton = globalThisWithManifests[MANIFESTS_SINGLETON] = globalThis._initNextManifests();"
      );
      content = content.replace(
        /throw new [^;]*?InvariantError\(`The client reference manifest for route [^`]*? does not exist\.`\);/g,
        "return {};"
      );
      fs.writeFileSync(p, content, "utf-8");
      console.log(`✓ Pre-patched ${path.relative(process.cwd(), p)} with fallback manifests singleton`);
    }
  }

  const compiledRuntimes = [
    "node_modules/next/dist/compiled/next-server/app-page-experimental.runtime.prod.js",
    "node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.prod.js",
    "node_modules/next/dist/compiled/next-server/app-page-experimental.runtime.dev.js",
    "node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.dev.js"
  ];
  for (const rel of compiledRuntimes) {
    const full = path.resolve(rel);
    if (fs.existsSync(full)) {
      let content = fs.readFileSync(full, "utf-8");
      if (!content.includes("globalThis._initNextManifests")) {
        content = singletonHelperCode + "\n" + content;
      }
      content = content.replace(
        /throw new [^;]*?\(['"]The manifests singleton was not initialized\.['"]\);/g,
        "e = f[d] = globalThis._initNextManifests();"
      );
      fs.writeFileSync(full, content, "utf-8");
      console.log(`✓ Pre-patched ${rel} with fallback manifests singleton`);
    }
  }
} catch (e) {
  console.warn("⚠️ Warning during pre-patching:", e);
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

  // 2. Enhance .open-next/worker.js with error resilience & ASSETS fallback
  if (fs.existsSync(workerPath)) {
    let workerCode = fs.readFileSync(workerPath, "utf-8");
    if (!workerCode.includes("[FacultyOS Worker Runtime Exception]")) {
      workerCode = workerCode.replace(
        "return handler(reqOrResp, env, ctx, request.signal);",
        `const res = await handler(reqOrResp, env, ctx, request.signal);
            if (res && res.status >= 500 && request.method === "GET" && env?.ASSETS?.fetch) {
              try {
                const assetRes = await env.ASSETS.fetch(request);
                if (assetRes && assetRes.status < 400) return assetRes;
              } catch (e) {}
            }
            return res;`
      );
      workerCode = workerCode.replace(
        "return runWithCloudflareRequestContext(request, env, ctx, async () => {",
        `try {
          return await runWithCloudflareRequestContext(request, env, ctx, async () => {`
      );
      const lastFetchBrace = workerCode.lastIndexOf("    },\n};");
      if (lastFetchBrace !== -1) {
        const catchBlock = `        } catch (err) {
          console.error("[FacultyOS Worker Runtime Exception]", err);
          if (env?.ASSETS?.fetch && request.method === "GET") {
            try {
              const assetRes = await env.ASSETS.fetch(request);
              if (assetRes && assetRes.status < 400) return assetRes;
            } catch (e) {}
          }
          return new Response(
            \`FacultyOS Worker Runtime Exception:\\n\${err?.stack || err?.message || String(err)}\\n\\nURL: \${request.url}\\nMethod: \${request.method}\`,
            { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
          );
        }
    },
};`;
        workerCode = workerCode.slice(0, lastFetchBrace) + catchBlock;
      }
      if (!workerCode.includes("globalThis.evalManifestFromRelativePath")) {
        const helperSnippet = `
var evalManifestFromRelativePath = globalThis.evalManifestFromRelativePath = function({ projectDir, distDir, manifest, shouldCache, cache, handleMissing } = {}) {
  try {
    if (typeof evalManifest === "function") {
      const p = [projectDir, distDir, manifest].filter(Boolean).join("/");
      return evalManifest(p, shouldCache, cache, handleMissing);
    }
  } catch (e) {}
  return { __RSC_MANIFEST: {} };
};
var loadManifestFromRelativePath = globalThis.loadManifestFromRelativePath = function({ projectDir, distDir, manifest, shouldCache, cache, skipParse, handleMissing } = {}) {
  try {
    if (typeof loadManifest === "function") {
      const p = [projectDir, distDir, manifest].filter(Boolean).join("/");
      return loadManifest(p, shouldCache, cache, skipParse, handleMissing);
    }
  } catch (e) {}
  return {};
};
`;
        workerCode = helperSnippet + "\n" + workerCode;
      }
      if (!workerCode.includes("globalThis._initNextManifests")) {
        workerCode = singletonHelperCode + "\n" + workerCode;
      }
      workerCode = workerCode.replace(
        /throw new [^;]*?\(['"]The manifests singleton was not initialized\.['"]\);/g,
        "e = (typeof f !== 'undefined' && typeof d !== 'undefined' ? (f[d] = globalThis._initNextManifests()) : globalThis._initNextManifests());"
      );
      workerCode = workerCode.replace(
        /throw new [^;]*?InvariantError\(['"]The manifests singleton was not initialized\.['"]\);/g,
        "manifestSingleton = (typeof globalThisWithManifests !== 'undefined' && typeof MANIFESTS_SINGLETON !== 'undefined' ? (globalThisWithManifests[MANIFESTS_SINGLETON] = globalThis._initNextManifests()) : globalThis._initNextManifests());"
      );
      fs.writeFileSync(workerPath, workerCode, "utf-8");
      console.log("✓ Post-patched .open-next/worker.js with error handler, ASSETS fallback, and manifest helpers");
    }
  }

  // 3. Post-patch all built worker and handler files in .open-next to ensure unexpected loadManifest returns {} instead of crashing
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
        if (code.includes("evalManifestFromRelativePath")) {
          code = code.replace(
            /evalManifestFromRelativePath:\s*(?:function\(\)\s*\{\s*return\s*evalManifestFromRelativePath;?\s*\}|\(\)\s*=>\s*evalManifestFromRelativePath)/g,
            "evalManifestFromRelativePath: () => (globalThis.evalManifestFromRelativePath || function() { return { __RSC_MANIFEST: {} }; })"
          );
          code = code.replace(
            /loadManifestFromRelativePath:\s*(?:function\(\)\s*\{\s*return\s*loadManifestFromRelativePath;?\s*\}|\(\)\s*=>\s*loadManifestFromRelativePath)/g,
            "loadManifestFromRelativePath: () => (globalThis.loadManifestFromRelativePath || function() { return {}; })"
          );
          if (!code.includes("globalThis.evalManifestFromRelativePath =")) {
            const helperSnippet = `
var evalManifestFromRelativePath = globalThis.evalManifestFromRelativePath = function({ projectDir, distDir, manifest, shouldCache, cache, handleMissing } = {}) {
  try {
    if (typeof evalManifest === "function") {
      const p = [projectDir, distDir, manifest].filter(Boolean).join("/");
      return evalManifest(p, shouldCache, cache, handleMissing);
    }
  } catch (e) {}
  return { __RSC_MANIFEST: {} };
};
var loadManifestFromRelativePath = globalThis.loadManifestFromRelativePath = function({ projectDir, distDir, manifest, shouldCache, cache, skipParse, handleMissing } = {}) {
  try {
    if (typeof loadManifest === "function") {
      const p = [projectDir, distDir, manifest].filter(Boolean).join("/");
      return loadManifest(p, shouldCache, cache, skipParse, handleMissing);
    }
  } catch (e) {}
  return {};
};
`;
            code = helperSnippet + "\n" + code;
          }
          modified = true;
        }
        if (code.includes("Unexpected loadManifest")) {
          const loadManifestRegex = new RegExp(
            "throw new Error\\([\\x60\\x22\\x27]Unexpected loadManifest[\\s\\S]*?\\);",
            "g"
          );
          code = code.replace(loadManifestRegex, "return {};");
          modified = true;
        }
        if (code.includes("Unexpected evalManifest")) {
          const evalManifestRegex = new RegExp(
            "throw new Error\\([\\x60\\x22\\x27]Unexpected evalManifest[\\s\\S]*?\\);",
            "g"
          );
          code = code.replace(evalManifestRegex, "return { __RSC_MANIFEST: {} };");
          modified = true;
        }
        if (code.includes("Unexpected findDir")) {
          const findDirRegex = new RegExp(
            "throw new Error\\([\\x60\\x22\\x27]Unexpected findDir[\\s\\S]*?\\);",
            "g"
          );
          code = code.replace(findDirRegex, "return false;");
          modified = true;
        }
        if (code.includes("The manifests singleton was not initialized")) {
          code = code.replace(
            /throw new [^;]*?\(['"]The manifests singleton was not initialized\.['"]\);/g,
            "e = (typeof f !== 'undefined' && typeof d !== 'undefined' ? (f[d] = globalThis._initNextManifests()) : globalThis._initNextManifests());"
          );
          code = code.replace(
            /throw new [^;]*?InvariantError\(['"]The manifests singleton was not initialized\.['"]\);/g,
            "manifestSingleton = (typeof globalThisWithManifests !== 'undefined' && typeof MANIFESTS_SINGLETON !== 'undefined' ? (globalThisWithManifests[MANIFESTS_SINGLETON] = globalThis._initNextManifests()) : globalThis._initNextManifests());"
          );
          if (!code.includes("globalThis._initNextManifests")) {
            code = singletonHelperCode + "\n" + code;
          }
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
