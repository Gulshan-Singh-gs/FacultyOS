import fs from 'node:fs';

const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const regex = /async function \w+\((\w+),(\w+),(\w+),(\w+)\)\{try\{let\{errored:\w+,destroyed:\w+\}=\2/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log('Matched at:', match.index);
}
