import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
const idx = 4762116;
console.log(content.substring(idx - 1400, idx - 500));
