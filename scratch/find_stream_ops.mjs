import fs from 'node:fs';

const c = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
const idx = 2580124;
const streamOpsIdx = c.lastIndexOf('stream-ops', idx);
console.log('streamOpsIdx:', streamOpsIdx);
if (streamOpsIdx !== -1) {
  console.log(c.substring(streamOpsIdx - 200, streamOpsIdx + 300));
}
