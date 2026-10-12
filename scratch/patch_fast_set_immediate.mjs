import fs from 'node:fs';

const filePath = '.open-next/server-functions/default/handler.mjs';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ensure globalThis.setImmediate is available and real
if (!content.includes('globalThis.setImmediate = globalThis.setImmediate ||')) {
  content = `if (typeof globalThis.setImmediate !== "function") {
  globalThis.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
  globalThis.clearImmediate = (id) => clearTimeout(id);
}\n` + content;
}

// 2. Disable Next.js fast-set-immediate patch so it doesn't trap React Fizz's setImmediate callbacks
const fastImmediateRegex = /function install\(\)\{\{debug2\?\.\(["']installing fast setImmediate patch["']\)/;
if (fastImmediateRegex.test(content)) {
  content = content.replace(
    fastImmediateRegex,
    'function install(){ return; } function _disabled_install(){'
  );
  console.log('✓ Successfully bypassed Next.js fast-set-immediate in handler.mjs!');
} else {
  console.log('fastImmediateRegex not matched or already bypassed');
}

fs.writeFileSync(filePath, content, 'utf8');
