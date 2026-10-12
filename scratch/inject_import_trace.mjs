import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

// Trace function l:
const targetL = 'function l(e3){var t3=globalThis.__next_require__(e3);';
const replaceL = 'function l(e3){var t3=globalThis.__next_require__(e3);console.log("[FACULTYOS_TRACE] l(e3) CALLED:", e3, "isPromise:", typeof t3?.then === "function", "status:", t3?.status);if(typeof t3?.then === "function"){t3.then(v=>console.log("[FACULTYOS_TRACE] module Promise RESOLVED:", e3), e=>console.error("[FACULTYOS_TRACE] module Promise REJECTED:", e3, e));}';

if (code.includes(targetL)) {
  code = code.replace(targetL, replaceL);
  console.log('✓ Injected function l trace');
} else {
  console.log('Target L not found');
}

// Trace function c:
const targetC = 'function c(e3){for(var t3=e3[1],n3=[],a3=0;a3<t3.length;){';
const replaceC = 'function c(e3){console.log("[FACULTYOS_TRACE] c(e3) CALLED:", JSON.stringify(e3));for(var t3=e3[1],n3=[],a3=0;a3<t3.length;){';

if (code.includes(targetC)) {
  code = code.replace(targetC, replaceC);
  console.log('✓ Injected function c trace');
} else {
  console.log('Target C not found');
}

fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
console.log('Done injecting import trace.');
