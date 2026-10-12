import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

let idx = 0;
while ((idx = content.indexOf('stream-ops.node.js', idx)) !== -1) {
  console.log('at', idx, ':', content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 300)));
  idx += 18;
}
