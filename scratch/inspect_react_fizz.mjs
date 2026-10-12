import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const idx = 7852299;
console.log(content.substring(idx - 200, idx + 800));
