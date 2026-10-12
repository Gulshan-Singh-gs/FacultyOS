import fs from 'fs';
const code = fs.readFileSync('node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-client.node.production.js', 'utf8');
let idx = code.indexOf('function requireModule(');
console.log(code.slice(idx, idx + 600));
