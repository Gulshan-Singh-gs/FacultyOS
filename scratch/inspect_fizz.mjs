import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

let idx = 0;
while ((idx = content.indexOf('renderToPipeableStream', idx)) !== -1) {
  console.log('at', idx, ':', content.substring(Math.max(0, idx - 50), Math.min(content.length, idx + 300)));
  idx += 22;
}
