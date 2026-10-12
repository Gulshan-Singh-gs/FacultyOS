import fs from 'fs';
const code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
let idx = code.indexOf('let S={require:P,loadChunk:Q}');
console.log(code.slice(idx - 600, idx + 100));
