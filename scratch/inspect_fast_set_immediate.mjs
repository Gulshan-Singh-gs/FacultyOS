import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const idx = 1528636;
console.log(content.substring(idx - 300, idx + 600));
