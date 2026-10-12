import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

// Find function initializeModuleChunk or in minified code function z or similar
// Let's search for `function initializeModuleChunk` or where `requireModule` / `d(e3.value)` is called
// In turbopack client:
const targetInit = 'function initializeModuleChunk(chunk){try{var value=requireModule(chunk.value);';
const replaceInit = 'function initializeModuleChunk(chunk){console.log("[FACULTYOS_TRACE] initializeModuleChunk CALLED for:",JSON.stringify(chunk.value));try{var value=requireModule(chunk.value);console.log("[FACULTYOS_TRACE] initializeModuleChunk SUCCESS! typeof value:",typeof value);';

// Let's also check minified names in handler.mjs
console.log('Includes targetInit:', code.includes(targetInit));

if (code.includes(targetInit)) {
  code = code.replaceAll(targetInit, replaceInit);
  console.log('✓ Injected initializeModuleChunk trace');
} else {
  // Let's find how initializeModuleChunk is named in handler.mjs:
  let idx = 0;
  while ((idx = code.indexOf('requireModule(', idx)) !== -1) {
    console.log('requireModule call at', idx, ':', code.slice(idx - 60, idx + 100));
    idx += 14;
  }
}

fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
