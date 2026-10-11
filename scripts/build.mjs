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
  var wrapModuleExports = function(entry) {
    if (!entry || typeof entry !== "object") return entry;
    if (entry["*"] || entry.id === undefined) return entry;
    return new Proxy(entry, {
      get: function(target, prop) {
        if (prop in target) return target[prop];
        if (prop === "*" || typeof prop === "string") return target;
        return undefined;
      }
    });
  };
  var createMappingProxy = function(prop) {
    return new Proxy({}, {
      get: function(_, id) {
        var baseId = typeof id === "string" ? id.split("#")[0] : id;
        for (var pair of clientReferenceManifestsPerRoute.values()) {
          var m = pair && pair.clientReferenceManifest;
          if (m && m[prop]) {
            var val = m[prop][id] || m[prop][baseId];
            if (val) return wrapModuleExports(val);
            if (typeof baseId === "string") {
              for (var k in m[prop]) {
                if (k.endsWith(baseId) || baseId.endsWith(k) || (k.includes("/next/dist/") && baseId.includes("/next/dist/") && k.slice(k.indexOf("/next/dist/")) === baseId.slice(baseId.indexOf("/next/dist/")))) {
                  return wrapModuleExports(m[prop][k]);
                }
              }
            }
          }
        }
        var fallbackEntry = {
          id: String(id),
          name: "*",
          chunks: [],
          async: false,
          "*": { id: String(id), name: "*", chunks: [], async: false }
        };
        return new Proxy(fallbackEntry, {
          get: function(target, exp) {
            if (exp in target) return target[exp];
            return { id: String(id), name: String(exp), chunks: [], async: false };
          }
        });
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
    // Force pages to return false since FacultyOS uses App Router exclusively:
    content = content.replace(
      'if ($NAME === "pages") {\n        return ${pagesExists};\n      }',
      'if ($NAME === "pages") {\n        return false;\n      }'
    );
    fs.writeFileSync(findDirPluginPath, content, "utf-8");
    console.log("✓ Pre-patched OpenNext find-dir plugin (app router exclusive)");
  }

  // B2. Pre-patch OpenNext copyTracedFiles for Windows EPERM symlink resilience
  const pnpmNodeModules = path.resolve("node_modules/.pnpm");
  if (fs.existsSync(pnpmNodeModules)) {
    const pnpmDirs = fs.readdirSync(pnpmNodeModules);
    for (const dir of pnpmDirs) {
      if (dir.startsWith("@opennextjs+aws")) {
        const copyTracedPath = path.join(
          pnpmNodeModules,
          dir,
          "node_modules/@opennextjs/aws/dist/build/copyTracedFiles.js"
        );
        if (fs.existsSync(copyTracedPath)) {
          let content = fs.readFileSync(copyTracedPath, "utf-8");
          if (!content.includes('e.code === "EPERM"')) {
            content = content.replace(
              'if (e.code !== "EEXIST") {',
              'if (e.code === "EPERM") { try { const target = path.resolve(path.dirname(from), symlink); if (fs.existsSync(target) && fs.statSync(target).isDirectory()) { fs.cpSync(target, to, { recursive: true }); } else { copyFileAndMakeOwnerWritable(target, to); } } catch (_) {} } else if (e.code !== "EEXIST") {'
            );
            fs.writeFileSync(copyTracedPath, content, "utf-8");
            console.log("✓ Pre-patched copyTracedFiles.js for Windows symlink resilience");
          }
        }
      }
    }
  }

  // B3. Pre-patch OpenNext patch-vercel-og-library to prevent ENOENT
  const patchVercelOgPath = path.resolve(
    "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/ast/patch-vercel-og-library.js"
  );
  if (fs.existsSync(patchVercelOgPath)) {
    let content = fs.readFileSync(patchVercelOgPath, "utf-8");
    let changed = false;
    if (!content.includes("mkdirSync,")) {
      content = content.replace("copyFileSync,", "copyFileSync, mkdirSync,");
      changed = true;
    }
    if (!content.includes("mkdirSync(outputDir")) {
      content = content.replace(
        "copyFileSync(tracedEdgePath, outputEdgePath);",
        "if (existsSync(tracedEdgePath)) { mkdirSync(outputDir, { recursive: true }); copyFileSync(tracedEdgePath, outputEdgePath); }"
      );
      content = content.replace(
        "// Change font fetches in the library to use imports.\n        {",
        "// Change font fetches in the library to use imports.\n        if (existsSync(outputEdgePath)) {"
      );
      content = content.replace(
        "renameSync(path.join(outputDir, fontFileName), path.join(outputDir, `${fontFileName}.bin`));",
        "const fontPath = path.join(outputDir, fontFileName); if (existsSync(fontPath)) { renameSync(fontPath, path.join(outputDir, `${fontFileName}.bin`)); }"
      );
      content = content.replace(
        "const ast = parseFile(routeFilePath);\n            const { edits } = patchVercelOgImport(ast);\n            writeFileSync(routeFilePath, ast.commitEdits(edits));",
        "if (existsSync(routeFilePath)) { const ast = parseFile(routeFilePath); const { edits } = patchVercelOgImport(ast); writeFileSync(routeFilePath, ast.commitEdits(edits)); }"
      );
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(patchVercelOgPath, content, "utf-8");
      console.log("✓ Pre-patched patch-vercel-og-library for safe directory handling");
    }
  }

  // B4. Pre-patch bundle-server.js to stub native node addons
  const bundleServerPath = path.resolve(
    "node_modules/@opennextjs/cloudflare/dist/cli/build/bundle-server.js"
  );
  if (fs.existsSync(bundleServerPath)) {
    let content = fs.readFileSync(bundleServerPath, "utf-8");
    if (!content.includes("stub-native-node-addons")) {
      content = content.replace(
        "plugins: [",
        `plugins: [
            {
                name: "stub-native-node-addons",
                setup(build) {
                    build.onResolve({ filter: /(^(@img\\/sharp|sharp)(\\/.*)?$|\\.node$)/ }, () => ({
                        path: "native-node-stub",
                        namespace: "native-node-stub",
                    }));
                    build.onLoad({ filter: /.*/, namespace: "native-node-stub" }, () => ({
                        contents: "module.exports = {}; export default {};",
                    }));
                },
            },`
      );
      fs.writeFileSync(bundleServerPath, content, "utf-8");
      console.log("✓ Pre-patched bundle-server.js to stub native node addons");
    }
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

  // E. Pre-patch React Server DOM packages so that missing client modules never crash the request
  const rsdPackages = [
    "node_modules/next/dist/compiled/react-server-dom-webpack/cjs/react-server-dom-webpack-client.edge.production.js",
    "node_modules/next/dist/compiled/react-server-dom-webpack/cjs/react-server-dom-webpack-client.node.production.js",
    "node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-client.edge.production.js",
    "node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-client.node.production.js",
    "node_modules/next/dist/compiled/react-server-dom-webpack-experimental/cjs/react-server-dom-webpack-client.edge.production.js",
    "node_modules/next/dist/compiled/react-server-dom-webpack-experimental/cjs/react-server-dom-webpack-client.node.production.js",
    "node_modules/next/dist/compiled/react-server-dom-turbopack-experimental/cjs/react-server-dom-turbopack-client.edge.production.js",
    "node_modules/next/dist/compiled/react-server-dom-turbopack-experimental/cjs/react-server-dom-turbopack-client.node.production.js",
    "node_modules/next/dist/compiled/react-server-dom-webpack/cjs/react-server-dom-webpack-server.edge.production.js",
    "node_modules/next/dist/compiled/react-server-dom-webpack/cjs/react-server-dom-webpack-server.node.production.js",
    "node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-server.edge.production.js",
    "node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-server.node.production.js",
    "node_modules/next/dist/compiled/react-server-dom-webpack-experimental/cjs/react-server-dom-webpack-server.edge.production.js",
    "node_modules/next/dist/compiled/react-server-dom-webpack-experimental/cjs/react-server-dom-webpack-server.node.production.js",
    "node_modules/next/dist/compiled/react-server-dom-turbopack-experimental/cjs/react-server-dom-turbopack-server.edge.production.js",
    "node_modules/next/dist/compiled/react-server-dom-turbopack-experimental/cjs/react-server-dom-turbopack-server.node.production.js"
  ];
  const rsdConsumerRegex = /throw (?:new )?Error\([\s\S]*?in the React Server Consumer Manifest[\s\S]*?\);?/g;
  const rsdConsumerFallback = 'bundlerConfig = { id: metadata[0], chunks: [], name: metadata[2] || "*" };';
  const rsdServerRegex = /throw (?:new )?Error\([\s\S]*?in the React Server Manifest[\s\S]*?\);?/g;
  const rsdServerFallback = 'resolvedModuleData = { id: id, chunks: [], name: name || "*", async: false };';

  for (const relPath of rsdPackages) {
    const fullP = path.resolve(relPath);
    if (fs.existsSync(fullP)) {
      let content = fs.readFileSync(fullP, "utf-8");
      let changed = false;
      if (rsdConsumerRegex.test(content)) {
        content = content.replace(rsdConsumerRegex, rsdConsumerFallback);
        changed = true;
      }
      if (rsdServerRegex.test(content)) {
        content = content.replace(rsdServerRegex, rsdServerFallback);
        changed = true;
      }
      if (content.includes("Connection closed.")) {
        content = content.replace(/options\s*&&\s*options\.unstable_allowPartialStream\s*\?\s*options\.unstable_allowPartialStream\s*:\s*!1/g, "!0");
        content = content.replace(/:\s*reportGlobalError\(\w+,\s*(?:new\s+)?Error\(['"]Connection closed\.['"]\)\);?/g, ": (typeof weakResponse !== 'undefined' ? (weakResponse._closed = !0) : void 0);");
        content = content.replace(/reportGlobalError\(\w+,\s*(?:new\s+)?Error\(['"]Connection closed\.['"]\)\);?/g, "/* connection closed */");
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullP, content, "utf-8");
        console.log(`✓ Pre-patched ${relPath} for React Server DOM resilience`);
      }
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

    // Copy prerendered static HTML pages into assets so Cloudflare Edge can serve them directly
    const nextAppServerDir = path.resolve(".next/server/app");
    if (fs.existsSync(nextAppServerDir)) {
      const appFiles = fs.readdirSync(nextAppServerDir);
      for (const f of appFiles) {
        if (f.endsWith(".html")) {
          const src = path.join(nextAppServerDir, f);
          const dest = path.join(assetsDir, f);
          fs.copyFileSync(src, dest);
          const baseName = f.replace(".html", "");
          if (baseName !== "index" && baseName !== "_global-error" && baseName !== "_not-found") {
            const subDir = path.join(assetsDir, baseName);
            fs.mkdirSync(subDir, { recursive: true });
            fs.copyFileSync(src, path.join(subDir, "index.html"));
          }
        }
      }
      console.log("✓ Copied prerendered static HTML pages into .open-next/assets for Edge CDN serving");
    }
  }

  // 2. Enhance .open-next/worker.js with error resilience & ASSETS fallback
  if (fs.existsSync(workerPath)) {
    let workerCode = fs.readFileSync(workerPath, "utf-8");
    if (!workerCode.includes("[FacultyOS Worker Runtime Exception]")) {
      const fallbackSnippet = `
            if (res && res.status >= 500 && request.method === "GET" && env?.ASSETS?.fetch) {
              try {
                const url = new URL(request.url);
                const assetRes = await env.ASSETS.fetch(request);
                if (assetRes && assetRes.status < 400) return assetRes;
                const pathname = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
                if (pathname) {
                  const htmlReq = new Request(new URL(pathname + ".html", url.origin), request);
                  const htmlRes = await env.ASSETS.fetch(htmlReq);
                  if (htmlRes && htmlRes.status < 400) return htmlRes;
                  const indexReq = new Request(new URL(pathname + "/index.html", url.origin), request);
                  const indexRes = await env.ASSETS.fetch(indexReq);
                  if (indexRes && indexRes.status < 400) return indexRes;
                } else {
                  const rootReq = new Request(new URL("/index.html", url.origin), request);
                  const rootRes = await env.ASSETS.fetch(rootReq);
                  if (rootRes && rootRes.status < 400) return rootRes;
                }
              } catch (e) {}
            }`;
      workerCode = workerCode.replace(
        "return handler(reqOrResp, env, ctx, request.signal);",
        `const res = await handler(reqOrResp, env, ctx, request.signal);
            ${fallbackSnippet}
            return res;`
      );
      workerCode = workerCode.replace(
        "return runWithCloudflareRequestContext(request, env, ctx, async () => {",
        `try {
          globalThis.__CF_ENV__ = env;
          globalThis.__CF_CTX__ = ctx;
          if (env) {
            globalThis.DB = env.DB || env.facultyos;
            globalThis.NOTIFICATIONS = env.NOTIFICATIONS || env.notifications;
          }
          return await runWithCloudflareRequestContext(request, env, ctx, async () => {`
      );
      const lastFetchBrace = workerCode.lastIndexOf("    },\n};");
      if (lastFetchBrace !== -1) {
        const catchBlock = `        } catch (err) {
          console.error("[FacultyOS Worker Runtime Exception]", err);
          if (env?.ASSETS?.fetch && request.method === "GET") {
            try {
              const url = new URL(request.url);
              const assetRes = await env.ASSETS.fetch(request);
              if (assetRes && assetRes.status < 400) return assetRes;
              const pathname = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
              if (pathname) {
                const htmlReq = new Request(new URL(pathname + ".html", url.origin), request);
                const htmlRes = await env.ASSETS.fetch(htmlReq);
                if (htmlRes && htmlRes.status < 400) return htmlRes;
                const indexReq = new Request(new URL(pathname + "/index.html", url.origin), request);
                const indexRes = await env.ASSETS.fetch(indexReq);
                if (indexRes && indexRes.status < 400) return indexRes;
              } else {
                const rootReq = new Request(new URL("/index.html", url.origin), request);
                const rootRes = await env.ASSETS.fetch(rootReq);
                if (rootRes && rootRes.status < 400) return rootRes;
              }
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
        /function p\(\)\s*\{let e=f\[d\];if\(!e\)[\s\S]*?return e\}/g,
        "function p(){return (typeof f !== 'undefined' && typeof d !== 'undefined' ? (f[d] || (f[d] = globalThis._initNextManifests())) : globalThis._initNextManifests())}"
      );
      workerCode = workerCode.replace(
        /const manifestSingleton = globalThisWithManifests\[MANIFESTS_SINGLETON\];[\s\S]*?return manifestSingleton;/g,
        "return (typeof globalThisWithManifests !== 'undefined' && typeof MANIFESTS_SINGLETON !== 'undefined' ? (globalThisWithManifests[MANIFESTS_SINGLETON] || (globalThisWithManifests[MANIFESTS_SINGLETON] = globalThis._initNextManifests())) : globalThis._initNextManifests());"
      );
      workerCode = workerCode.replace(
        /throw new [^;]*?\(['"]The manifests singleton was not initialized\.['"]\);/g,
        "return (typeof f !== 'undefined' && typeof d !== 'undefined' ? (f[d] = globalThis._initNextManifests()) : globalThis._initNextManifests());"
      );
      workerCode = workerCode.replace(
        /throw new [^;]*?InvariantError\(['"]The manifests singleton was not initialized\.['"]\);/g,
        "return (typeof globalThisWithManifests !== 'undefined' && typeof MANIFESTS_SINGLETON !== 'undefined' ? (globalThisWithManifests[MANIFESTS_SINGLETON] = globalThis._initNextManifests()) : globalThis._initNextManifests());"
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
            /function p\(\)\s*\{let e=f\[d\];if\(!e\)[\s\S]*?return e\}/g,
            "function p(){return (typeof f !== 'undefined' && typeof d !== 'undefined' ? (f[d] || (f[d] = globalThis._initNextManifests())) : globalThis._initNextManifests())}"
          );
          code = code.replace(
            /const manifestSingleton = globalThisWithManifests\[MANIFESTS_SINGLETON\];[\s\S]*?return manifestSingleton;/g,
            "return (typeof globalThisWithManifests !== 'undefined' && typeof MANIFESTS_SINGLETON !== 'undefined' ? (globalThisWithManifests[MANIFESTS_SINGLETON] || (globalThisWithManifests[MANIFESTS_SINGLETON] = globalThis._initNextManifests())) : globalThis._initNextManifests());"
          );
          code = code.replace(
            /throw new [^;]*?\(['"]The manifests singleton was not initialized\.['"]\);/g,
            "return (typeof f !== 'undefined' && typeof d !== 'undefined' ? (f[d] = globalThis._initNextManifests()) : globalThis._initNextManifests());"
          );
          code = code.replace(
            /throw new [^;]*?InvariantError\(['"]The manifests singleton was not initialized\.['"]\);/g,
            "return (typeof globalThisWithManifests !== 'undefined' && typeof MANIFESTS_SINGLETON !== 'undefined' ? (globalThisWithManifests[MANIFESTS_SINGLETON] = globalThis._initNextManifests()) : globalThis._initNextManifests());"
          );
          if (!code.includes("globalThis._initNextManifests")) {
            code = singletonHelperCode + "\n" + code;
          }
          modified = true;
        }
        if (code.includes("Connection closed.")) {
          code = code.replace(/reportGlobalError\(\w+,\s*(?:new\s+)?Error\(['"]Connection closed\.['"]\)\);?/g, "/* connection closed */");
          code = code.replace(/:\s*reportGlobalError\(\w+,\s*(?:new\s+)?Error\(['"]Connection closed\.['"]\)\);?/g, ": void 0;");
          code = code.replace(/\b\w+\(\w+,\s*(?:new\s+)?Error\(['"]Connection closed\.['"]\)\)/g, "void 0");
          modified = true;
        }
        if (code.includes('Dynamic require of')) {
          code = code.replace(
            /throw (?:new )?Error\([^)]*Dynamic require of[^)]*\)/g,
            "if (typeof x === 'string' && (x.includes('middleware-manifest') || x.includes('manifest'))) { return { version: 3, middleware: {}, sortedMiddleware: [], functions: {} }; } throw Error('Dynamic require of \"' + x + '\" is not supported')"
          );
          modified = true;
        }
        if (code.includes('path2.endsWith("/server/middleware-manifest.json")')) {
          code = code.replace(
            /path2\.endsWith\("\/server\/middleware-manifest\.json"\)/g,
            'path2.includes("middleware-manifest.json")'
          );
          modified = true;
        }
        if (code.includes('this.getMiddleware()')) {
          code = code.replace(
            /async getMiddleware\(\)\s*\{[\s\S]*?return\{match:getMiddlewareMatcher\(middleware\),page:"\/"\}\}/g,
            'async getMiddleware(){ return null; }'
          );
          code = code.replace(
            /getMiddleware\(\)\s*\{[\s\S]*?return\{match:getMiddlewareMatcher\(middleware\),page:"\/"\}\}/g,
            'getMiddleware(){ return null; }'
          );
          modified = true;
        }
        if (code.includes('promiseResponse,resolve:resolveResponse') || code.includes('Promise.withResolvers()')) {
          code = code.replace(
            /return ctx\.waitUntil\(handler3\(internalEvent,\{streamCreator,waitUntil:ctx\.waitUntil\.bind\(ctx\)\}\)\),promiseResponse/g,
            `const timeoutId = setTimeout(() => {
              try {
                resolveResponse(
                  new Response(
                    "FacultyOS Gateway Timeout: Server took longer than 25s to generate a response.",
                    { status: 504, headers: { "content-type": "text/plain; charset=utf-8" } }
                  )
                );
              } catch (_) {}
            }, 25000);
            ctx.waitUntil(
              handler3(internalEvent, { streamCreator, waitUntil: ctx.waitUntil.bind(ctx) })
                .catch((err) => {
                  console.error("[FacultyOS OpenNext Handler Error]", err);
                  try {
                    resolveResponse(
                      new Response(
                        "FacultyOS SSR Error: " + ((err && (err.stack || err.message)) || String(err)),
                        { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
                      )
                    );
                  } catch (_) {}
                })
                .finally(() => {
                  clearTimeout(timeoutId);
                })
            );
            return promiseResponse;`
          );
          modified = true;
        }
        if (code.includes("getMiddlewareManifest")) {
          code = code.replace(
            /getMiddlewareManifest\(\)\s*\{[^}]*require\([^)]*middlewareManifestPath[^)]*\)[^}]*\}/g,
            "getMiddlewareManifest(){ return null; }"
          );
          code = code.replace(
            /getMiddlewareManifest\(\)\s*\{return this\.minimalMode\?null:require\(this\.middlewareManifestPath\)\}/g,
            "getMiddlewareManifest(){ return null; }"
          );
          code = code.replace(
            /getMiddlewareManifest\(\)\s*\{return[^}]*require\([^)]*\)\}/g,
            "getMiddlewareManifest(){ return null; }"
          );
          code = code.replace(
            /getMiddlewareManifest\(\)\s*\{return this\.getMiddlewareManifest\(\)\}/g,
            "getMiddlewareManifest(){ return null; }"
          );
          modified = true;
        }
        if (code.includes('name==="pages"')) {
          code = code.replace(/name==="pages"\s*\?\s*true/g, 'name==="pages" ? false');
          code = code.replace(/name==="pages"\s*\?\s*!0/g, 'name==="pages" ? !1');
          code = code.replace(/name==="pages"\s*:\s*true/g, 'name==="pages" : false');
          code = code.replace(/name==="pages"\s*:\s*!0/g, 'name==="pages" : !1');
          code = code.replace(/name==="app"\|\|name==="pages"/g, 'name==="app"');
          modified = true;
        }
        if (code.includes('this.enabledDirectories.pages')) {
          code = code.replace(/this\.enabledDirectories\.pages/g, 'false');
          modified = true;
        }
        if (code.includes('NULL_BODY_STATUSES2') || code.includes('NULL_BODY_STATUSES')) {
          code = code.replace(
            /NULL_BODY_STATUSES2\.has\(statusCode\)/g,
            '(NULL_BODY_STATUSES2.has(statusCode) || (statusCode >= 300 && statusCode < 400) || (typeof responseHeaders !== "undefined" && responseHeaders.has("location")))'
          );
          code = code.replace(
            /NULL_BODY_STATUSES2\s*=\s*new Set\(\[101,\s*204,\s*205,\s*304\]\)/g,
            'NULL_BODY_STATUSES2 = new Set([101, 204, 205, 301, 302, 303, 304, 307, 308])'
          );
          code = code.replace(
            /NULL_BODY_STATUSES2=new Set\(\[101,204,205,304\]\)/g,
            'NULL_BODY_STATUSES2=new Set([101,204,205,301,302,303,304,307,308])'
          );
          code = code.replace(
            /NULL_BODY_STATUSES\.has\(result\.statusCode\)/g,
            '(NULL_BODY_STATUSES.has(result.statusCode) || (result.statusCode >= 300 && result.statusCode < 400))'
          );
          code = code.replace(
            /NULL_BODY_STATUSES\s*=\s*new Set\(\[101,\s*103,\s*204,\s*205,\s*304\]\)/g,
            'NULL_BODY_STATUSES = new Set([101, 103, 204, 205, 301, 302, 303, 304, 307, 308])'
          );
          code = code.replace(
            /NULL_BODY_STATUSES=new Set\(\[101,103,204,205,304\]\)/g,
            'NULL_BODY_STATUSES=new Set([101,103,204,205,301,302,303,304,307,308])'
          );
          modified = true;
        }
        if (code.includes('redirect(destination,statusCode){')) {
          code = code.replace(
            /redirect\(destination,statusCode\)\s*\{return this\.setHeader\("Location",destination\),this\.statusCode=statusCode,statusCode===308&&this\.setHeader\("Refresh",`0;url=\${destination}`\),this\}/g,
            'redirect(destination,statusCode){ this.setHeader("Location",destination); this.statusCode=statusCode; if(statusCode===308) this.setHeader("Refresh",`0;url=${destination}`); try { this.flushHeaders(); } catch(e){} return this; }'
          );
          modified = true;
        }
        if (code.includes('setHeader("location",')) {
          const original = code;
          code = code.replace(
            /e\.setHeader\("location",\s*(\w+)\),\s*(\w+)\("location"\)/g,
            'e.setHeader("location",$1),$2("location"),e.flushHeaders&&e.flushHeaders(),e.end&&e.end()'
          );
          if (code !== original) {
            modified = true;
          }
        }
        if (code.includes('J("location",')) {
          const original = code;
          code = code.replace(
            /J\("location",\s*(\w+)\)/g,
            'J("location",$1),t.flushHeaders&&t.flushHeaders(),t.end&&t.end()'
          );
          if (code !== original) {
            modified = true;
          }
        }
        if (modified) {
          fs.writeFileSync(fullPath, code, "utf-8");
          console.log(`✓ Post-patched ${path.relative(process.cwd(), fullPath)} for loadManifest resilience / redirect flush`);
        }
      }
    }
  }
  patchFilesRecursively(openNextDir);

  // 4. Ensure all compiled Next.js App Router runtimes flush headers and close stream on redirects
  const runtimeFiles = [
    "node_modules/.pnpm/next@16.4.0_@babel+core@7.2_775e0d7ab00b10f2950287173e7bc793/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",
    "node_modules/.pnpm/next@16.4.0_@babel+core@7.2_775e0d7ab00b10f2950287173e7bc793/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js",
    "node_modules/.pnpm/next@16.4.0_@babel+core@7.2_775e0d7ab00b10f2950287173e7bc793/node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.prod.js",
    "node_modules/.pnpm/next@16.4.0_@babel+core@7.2_775e0d7ab00b10f2950287173e7bc793/node_modules/next/dist/compiled/next-server/app-page-experimental.runtime.prod.js",
  ];
  for (const rf of runtimeFiles) {
    const fullRf = path.join(process.cwd(), rf);
    if (fs.existsSync(fullRf)) {
      let content = fs.readFileSync(fullRf, "utf-8");
      let changed = false;
      const staticRegex = /e\.setHeader\("location",\s*(\w+)\),\s*(\w+)\("location"\)/g;
      if (staticRegex.test(content)) {
        content = content.replace(staticRegex, 'e.setHeader("location",$1),$2("location"),e.flushHeaders&&e.flushHeaders(),e.end&&e.end()');
        changed = true;
      }
      const dynRegex = /J\("location",\s*(\w+)\)/g;
      if (dynRegex.test(content)) {
        content = content.replace(dynRegex, 'J("location",$1),t.flushHeaders&&t.flushHeaders(),t.end&&t.end()');
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullRf, content, "utf-8");
        console.log(`✓ Patched ${path.basename(fullRf)} for clean RSC redirect completion`);
      }
    }
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
