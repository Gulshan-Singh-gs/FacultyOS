import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const regex = /function install\(\)\{\{debug2\?\.\(["']installing fast setImmediate patch["']\)/g;
const matches = content.match(regex);
console.log('Matches:', matches ? matches.length : 0);
