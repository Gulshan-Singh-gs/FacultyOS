import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const idx = content.indexOf('function install');
console.log('found at', idx);
console.log(content.substring(idx - 50, idx + 400));
