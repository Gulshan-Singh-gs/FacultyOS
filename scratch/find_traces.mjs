import fs from 'node:fs';
const c = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
const regex = /\[FACULTYOS_TRACE\][^"]+/g;
const matches = c.match(regex) || [];
console.log('Trace matches found:', matches.length);
for (const m of [...new Set(matches)]) {
  console.log(' -', m);
}
