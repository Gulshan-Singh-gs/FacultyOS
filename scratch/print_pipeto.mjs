import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
const idx = 4757460;
console.log(content.substring(idx, idx + 1500));
