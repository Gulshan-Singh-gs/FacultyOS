import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

// Trace function o:
const targetO = 'function o(e3){var t3=globalThis.__next_require__(e3);';
const replaceO = 'function o(e3){var t3=globalThis.__next_require__(e3);console.log("[FACULTYOS_TRACE] o(e3) __next_require__:", e3, "isPromise:", typeof t3?.then === "function", "status:", t3?.status);if(typeof t3?.then === "function"){t3.then(v=>console.log("[FACULTYOS_TRACE] o(e3) PROMISE RESOLVED:", e3), e=>console.error("[FACULTYOS_TRACE] o(e3) PROMISE REJECTED:", e3, e));}';

if (code.includes(targetO)) {
  code = code.replace(targetO, replaceO);
  console.log('✓ Injected function o trace');
} else {
  console.log('Target O not found');
}

// Trace function d:
const targetD = 'function d(e3){for(var t3=e3[1],r3=[],n3=0;n3<t3.length;n3++){';
const replaceD = 'function d(e3){console.log("[FACULTYOS_TRACE] d(e3) CALLED with:", JSON.stringify(e3));for(var t3=e3[1],r3=[],n3=0;n3<t3.length;n3++){var chunkName=t3[n3];';

if (code.includes(targetD)) {
  code = code.replace(targetD, replaceD);
  console.log('✓ Injected function d entry trace');
} else {
  console.log('Target D not found');
}

// Trace __next_chunk_load__:
const targetChunk = 'var a3=globalThis.__next_chunk_load__(t3[n3]);';
const replaceChunk = 'var a3=globalThis.__next_chunk_load__(chunkName);console.log("[FACULTYOS_TRACE] __next_chunk_load__:", chunkName, "isPromise:", typeof a3?.then === "function", "status:", a3?.status);if(typeof a3?.then === "function"){a3.then(v=>console.log("[FACULTYOS_TRACE] chunk load RESOLVED:", chunkName), e=>console.error("[FACULTYOS_TRACE] chunk load REJECTED:", chunkName, e));}';

if (code.includes(targetChunk)) {
  code = code.replace(targetChunk, replaceChunk);
  console.log('✓ Injected __next_chunk_load__ trace');
} else {
  console.log('Target Chunk not found');
}

fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
console.log('Done injecting d traces.');
