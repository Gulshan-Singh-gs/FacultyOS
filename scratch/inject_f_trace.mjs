import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

// Trace function f(e3)
const targetF = 'function f(e3){var t3=globalThis.__next_require__(e3[0]);';
const replaceF = 'function f(e3){console.log("[FACULTYOS_TRACE] f(e3) CALLED with:", JSON.stringify(e3));var t3=globalThis.__next_require__(e3[0]);console.log("[FACULTYOS_TRACE] f(e3) t3 result:", typeof t3);';

if (code.includes(targetF)) {
  code = code.replace(targetF, replaceF);
  console.log('✓ Injected function f trace');
} else {
  console.log('Target F not found');
}

// Trace function V(e3)
const targetV = 'function V(e3){try{var t3=f(e3.value);e3.status="fulfilled",e3.value=t3,e3.reason=null}catch(t4){e3.status="rejected",e3.reason=t4}}';
const replaceV = 'function V(e3){console.log("[FACULTYOS_TRACE] V(e3) CALLED for:", JSON.stringify(e3.value));try{var t3=f(e3.value);console.log("[FACULTYOS_TRACE] V(e3) f returned typeof:", typeof t3);e3.status="fulfilled",e3.value=t3,e3.reason=null}catch(t4){console.error("[FACULTYOS_TRACE] V(e3) CAUGHT ERROR:", t4?.message, t4?.stack);e3.status="rejected",e3.reason=t4}}';

if (code.includes(targetV)) {
  code = code.replace(targetV, replaceV);
  console.log('✓ Injected function V trace');
} else {
  console.log('Target V not found');
}

fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
console.log('Done injecting f and V traces.');
