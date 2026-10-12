import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const target = 'installing fast setImmediate patch';
let idx = content.indexOf(target);
console.log('found at', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 100, idx + 400));
}
