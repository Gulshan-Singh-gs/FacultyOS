import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const idx = 7852299;
let found = content.lastIndexOf('function az(', idx);
console.log('function az at', found);
console.log(content.substring(found, found + 600));
