import fs from 'fs';
const code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
let idx = code.indexOf('react-server-dom-turbopack-client.node.production.js');
let slice = code.slice(idx, idx + 30000);
let fIdx = 0;
while ((fIdx = slice.indexOf('f(', fIdx)) !== -1) {
  let prev = slice[fIdx - 1];
  if (!/[a-zA-Z0-9_$]/.test(prev)) {
    console.log('Call f at', fIdx, ':', slice.slice(fIdx - 20, fIdx + 100));
  }
  fIdx += 2;
}
