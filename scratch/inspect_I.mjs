import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
const idx = 2921326;
console.log(content.substring(idx - 100, idx + 800));
