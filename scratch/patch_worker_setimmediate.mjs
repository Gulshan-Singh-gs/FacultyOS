import fs from 'node:fs';

const filePath = '.open-next/worker.js';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('globalThis.setImmediate = (fn, ...args) => setTimeout')) {
  content = `if (typeof globalThis.setImmediate !== "function") {
  globalThis.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
  globalThis.clearImmediate = (id) => clearTimeout(id);
}\n` + content;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Polyfilled setImmediate in worker.js');
} else {
  console.log('Already polyfilled');
}
