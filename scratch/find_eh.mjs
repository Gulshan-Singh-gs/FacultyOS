import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const idx = 3230365;
let found = content.lastIndexOf('function eh', idx);
if (found === -1) found = content.lastIndexOf('let eh', idx);
if (found === -1) found = content.lastIndexOf('var eh', idx);
console.log('eh at', found);
console.log(content.substring(found - 100, found + 600));
