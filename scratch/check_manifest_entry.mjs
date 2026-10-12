import fs from 'fs';
import vm from 'vm';

const file = '.next/server/app/(dashboard)/dashboard/page_client-reference-manifest.js';
const code = fs.readFileSync(file, 'utf8');
const ctx = { globalThis: {} };
vm.runInNewContext(code, ctx);

for (const [key, manifest] of Object.entries(ctx.globalThis.__RSC_MANIFEST || {})) {
  console.log('Manifest key:', key);
  console.log('ssrModuleMapping for ThemeProvider:', manifest.ssrModuleMapping?.['[project]/src/components/theme/theme-provider.tsx#ThemeProvider']);
  console.log('All ssrModuleMapping keys:');
  for (const k of Object.keys(manifest.ssrModuleMapping || {})) {
    console.log(' -', k, '->', manifest.ssrModuleMapping[k]);
  }
}
