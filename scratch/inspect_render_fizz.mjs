import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const idx = 3230365;
// Find "renderToNodeFizzStream"
console.log(content.substring(idx - 400, idx + 100));
