import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

// Find createFromNodeStream return statement
// In client module:
const targetG = 'return n3=t3=new eu(';
const replaceG = 'var retChunk; return n3=t3=new eu(';

code = code.replace('return n3=t3=new eu(', 'var retChunk; return n3=t3=new eu(');

// Find where G(t3,0) is returned
const targetEnd = 'G(t3,0)};';
const replaceEnd = 'retChunk=G(t3,0),console.log("[FACULTYOS_TRACE] G(t3,0) created with status:",retChunk.status),retChunk.then(v=>console.log("[FACULTYOS_TRACE] G(t3,0) PROMISE RESOLVED!"),e=>console.error("[FACULTYOS_TRACE] G(t3,0) PROMISE REJECTED:",e)),retChunk};';

if (code.includes(targetEnd)) {
  code = code.replace(targetEnd, replaceEnd);
  console.log('✓ Injected retChunk trace');
} else {
  console.log('Target end not found');
}

// In e3.on("end", a3)
const targetA3 = ',e3.on("end",a3),';
const replaceA3 = ',e3.on("end",function(){console.log("[FACULTYOS_TRACE] e3 on end called! chunk0 status:",t3._chunks.get(0)?.status);a3();console.log("[FACULTYOS_TRACE] a3 finished! chunk0 status:",t3._chunks.get(0)?.status);}),';

if (code.includes(targetA3)) {
  code = code.replace(targetA3, replaceA3);
  console.log('✓ Injected a3 end trace');
} else {
  console.log('Target a3 not found');
}

fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
console.log('Done injecting chunk 0 status traces.');
