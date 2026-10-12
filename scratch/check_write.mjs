import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

for (const p of [
  'write:async b4=>{if(!d3){',
  'flushHeaders(),(0,h.getTracer)()',
  'a3.flushHeaders()'
]) {
  console.log(p, 'found:', content.includes(p));
}
