import fs from 'node:fs';

const filePath = '.open-next/server-functions/default/handler.mjs';
let content = fs.readFileSync(filePath, 'utf8');

const target = 'if(typeof P2.then=="function"){h2.status=0,l2.thenableState=t11===nr?nC():null;var R2=l2.ping;P2.then(R2.resolve,R2.reject);break t}';
const replacement = 'if(typeof P2.then=="function"){console.log("[FACULTYOS_TRACE] ROOT SEGMENT SUSPENDED! P2 is Promise:", typeof P2.then, "P2 constructor:", P2.constructor?.name, "P2 stack:", P2.stack || P2, "node type:", l2.node?.type?.name || l2.node?.type, "node:", l2.node);h2.status=0,l2.thenableState=t11===nr?nC():null;var R2=l2.ping;P2.then(v=>{console.log("[FACULTYOS_TRACE] P2 resolved with:", v);R2.resolve(v);},e=>{console.error("[FACULTYOS_TRACE] P2 rejected with:", e);R2.reject(e);});break t}';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Successfully injected root segment suspended promise tracer!');
} else {
  console.error('Target string not found!');
}
