import fs from 'node:fs';

const filePath = '.open-next/server-functions/default/handler.mjs';
let content = fs.readFileSync(filePath, 'utf8');

const target = 'if(typeof f2.then=="function"){var p2=l2.ping;f2.then(p2.resolve,p2.reject),l2.thenableState=t11===nr?nC():null;break t}';
const replacement = 'if(typeof f2.then=="function"){console.log("[FACULTYOS_TRACE] ROOT TASK SUSPENDED! Promise:", f2, "Task node:", l2.node?.type?.name || l2.node?.type || l2.node, "ComponentStack:", l2.componentStack);var p2=l2.ping;f2.then(v=>{console.log("[FACULTYOS_TRACE] Suspended promise resolved:", v);p2.resolve(v);},e=>{console.error("[FACULTYOS_TRACE] Suspended promise rejected:", e);p2.reject(e);});l2.thenableState=t11===nr?nC():null;break t}';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Successfully injected suspended promise tracer into handler.mjs!');
} else {
  console.error('Target string not found!');
}
