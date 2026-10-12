import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const idx = 3230365;
console.log(content.substring(idx - 600, idx + 400));
