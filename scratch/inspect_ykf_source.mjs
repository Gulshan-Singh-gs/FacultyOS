import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const idx = 2921326;
// look backwards in stream-ops.node.js (starts around 2914385)
const streamOpsCode = content.substring(2914385, idx);
// find imports or definitions of y
console.log('Stream ops header:');
console.log(content.substring(2914385, 2915500));
