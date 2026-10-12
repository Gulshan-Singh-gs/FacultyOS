import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

let idx = 0;
let count = 0;
while ((idx = content.indexOf('setImmediate', idx)) !== -1) {
  count++;
  if (count <= 5) {
    console.log('at', idx, ':', content.substring(Math.max(0, idx - 50), Math.min(content.length, idx + 100)));
  }
  idx += 12;
}
console.log('Total setImmediate occurrences:', count);
