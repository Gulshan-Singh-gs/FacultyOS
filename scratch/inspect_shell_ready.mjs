import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const slice = content.substring(2914385, 2921326);
console.log(slice.substring(6118 - 400, 6118 + 200));
