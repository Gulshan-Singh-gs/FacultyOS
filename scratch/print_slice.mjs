import fs from 'fs';
const code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
let idx = code.indexOf('react-server-dom-turbopack-client.node.production.js');
let slice = code.slice(idx, idx + 20000);
let oIdx = slice.indexOf('function o(');
console.log(slice.slice(oIdx, oIdx + 500));
