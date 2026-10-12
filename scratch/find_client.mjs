import fs from 'fs';
const code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
let idx = code.indexOf('"./dist/compiled/react-server-dom-webpack/client.node.js"(e2,t2,r2)');
console.log(code.slice(idx, idx + 400));
