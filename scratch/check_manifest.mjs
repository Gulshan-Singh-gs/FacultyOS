import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const nextAppServerDir = path.resolve(".next/server/app");
function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) results.push(...walk(full));
    else if (f.name.endsWith("client-reference-manifest.js")) results.push(full);
  }
  return results;
}

const files = walk(nextAppServerDir);
console.log("Client reference manifest files found:", files.length);
for (const file of files) {
  console.log("File:", file);
  try {
    const code = fs.readFileSync(file, "utf-8");
    const ctx = { globalThis: {} };
    vm.runInNewContext(code, ctx);
    if (ctx.globalThis.__RSC_MANIFEST) {
      console.log("Keys in __RSC_MANIFEST:", Object.keys(ctx.globalThis.__RSC_MANIFEST));
    }
  } catch (err) {
    console.error(err);
  }
}
