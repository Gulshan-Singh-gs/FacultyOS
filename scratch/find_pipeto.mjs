import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

let idx = 0;
while ((idx = content.indexOf('pipeToNodeResponse', idx)) !== -1) {
  console.log(`[pipeToNodeResponse] at ${idx}:`, content.substring(Math.max(0, idx - 200), Math.min(content.length, idx + 400)));
  idx += 18;
}
