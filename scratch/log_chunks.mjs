import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

// Replace the logger in createFromNodeStream
const target = 'e3.on("data",c=>console.log("[FACULTYOS_TRACE] client e3 DATA:",c.length));';
const replacement = 'e3.on("data",c=>console.log("[FACULTYOS_TRACE] client e3 CHUNK:", c.length, typeof c === "string" ? c.slice(0, 100) : Buffer.from(c).toString("utf8").slice(0, 100)));';

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
  console.log('✓ Updated client e3 CHUNK logger');
} else {
  console.log('Target not found');
}
