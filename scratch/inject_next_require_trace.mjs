import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const targetRequire = 'globalThis.__next_require__=(...e11)=>{let t11=r10.require(...e11);return n10()&&(0,iA.trackPendingImport)(t11),t11}';
const replaceRequire = 'globalThis.__next_require__=(...e11)=>{console.log("[FACULTYOS_TRACE] __next_require__ CALLED with:",e11[0]);try{let t11=r10.require(...e11);console.log("[FACULTYOS_TRACE] __next_require__ RETURNED for:",e11[0],"typeof:",typeof t11);return n10()&&(0,iA.trackPendingImport)(t11),t11;}catch(err){console.error("[FACULTYOS_TRACE] __next_require__ THREW for:",e11[0],"error:",err?.message);throw err;}}';

if (code.includes(targetRequire)) {
  code = code.replace(targetRequire, replaceRequire);
  console.log('✓ Injected __next_require__ trace 1');
} else {
  console.log('Target require 1 not found');
}

// Check other instances of __next_require__=(...e11)=>
const targetRequire2 = 'globalThis.__next_require__=(...e11)=>{let t11=r10.require(...e11);return n10()&&(0,i$.trackPendingImport)(t11),t11}';
const replaceRequire2 = 'globalThis.__next_require__=(...e11)=>{console.log("[FACULTYOS_TRACE] __next_require__ CALLED with:",e11[0]);try{let t11=r10.require(...e11);console.log("[FACULTYOS_TRACE] __next_require__ RETURNED for:",e11[0],"typeof:",typeof t11);return n10()&&(0,i$.trackPendingImport)(t11),t11;}catch(err){console.error("[FACULTYOS_TRACE] __next_require__ THREW for:",e11[0],"error:",err?.message);throw err;}}';

if (code.includes(targetRequire2)) {
  code = code.replace(targetRequire2, replaceRequire2);
  console.log('✓ Injected __next_require__ trace 2');
} else {
  console.log('Target require 2 not found');
}

// In __next_chunk_load__
const targetChunk = 'globalThis.__next_chunk_load__=(...e11)=>{let t11=r10.loadChunk(...e11);return n10()&&(0,iA.trackPendingChunkLoad)(t11),t11}';
const replaceChunk = 'globalThis.__next_chunk_load__=(...e11)=>{console.log("[FACULTYOS_TRACE] __next_chunk_load__ CALLED with:",e11[0]);try{let t11=r10.loadChunk(...e11);console.log("[FACULTYOS_TRACE] __next_chunk_load__ RETURNED for:",e11[0],"typeof:",typeof t11);return n10()&&(0,iA.trackPendingChunkLoad)(t11),t11;}catch(err){console.error("[FACULTYOS_TRACE] __next_chunk_load__ THREW for:",e11[0],"error:",err?.message);throw err;}}';

if (code.includes(targetChunk)) {
  code = code.replace(targetChunk, replaceChunk);
  console.log('✓ Injected __next_chunk_load__ trace');
} else {
  console.log('Target chunk not found');
}

fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
console.log('Done injecting __next_require__ traces.');
