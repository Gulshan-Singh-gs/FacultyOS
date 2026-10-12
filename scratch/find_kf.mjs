import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const slice = content.substring(2914385, 2921326);
let idx = 0;
while ((idx = slice.indexOf('.kf', idx)) !== -1) {
  console.log('Found .kf at', idx, ':', slice.substring(Math.max(0, idx - 50), Math.min(slice.length, idx + 50)));
  idx += 3;
}
