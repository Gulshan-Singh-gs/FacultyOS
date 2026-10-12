import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const target = 'alias/react-dom-server.js';
let idx = 0;
while ((idx = content.indexOf(target, idx)) !== -1) {
  console.log('at', idx, ':', content.substring(Math.max(0, idx - 50), Math.min(content.length, idx + 300)));
  idx += target.length;
}
