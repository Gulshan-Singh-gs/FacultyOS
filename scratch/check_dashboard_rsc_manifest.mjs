import fs from 'node:fs';
import vm from 'node:vm';

const file = '.next/server/app/(dashboard)/dashboard/page_client-reference-manifest.js';
const code = fs.readFileSync(file, 'utf8');
const ctx = { globalThis: {} };
vm.runInNewContext(code, ctx);

console.log('Manifest keys:', Object.keys(ctx.globalThis.__RSC_MANIFEST));
const manifest = ctx.globalThis.__RSC_MANIFEST['/(dashboard)/dashboard/page'];
console.log('clientModules count:', Object.keys(manifest.clientModules || {}).length);
console.log('clientModules:');
for (const [mod, val] of Object.entries(manifest.clientModules || {})) {
  console.log(' -', mod, 'id:', val.id);
}
console.log('ssrModuleMapping count:', Object.keys(manifest.ssrModuleMapping || {}).length);
for (const [id, val] of Object.entries(manifest.ssrModuleMapping || {})) {
  console.log(' - SSR mapping for id', id, ':', val['*']?.chunks);
}
