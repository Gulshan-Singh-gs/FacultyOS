import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

// In createFromNodeStream in client module:
const targetClient = 'createFromNodeStream=function(e3,t3,r3){';
const replaceClient = 'createFromNodeStream=function(e3,t3,r3){console.log("[FACULTYOS_TRACE] client createFromNodeStream CALLED on stream!");e3.on("data",c=>console.log("[FACULTYOS_TRACE] client e3 DATA:",c.length));e3.on("end",()=>console.log("[FACULTYOS_TRACE] client e3 END"));';

if (code.includes(targetClient)) {
  code = code.replaceAll(targetClient, replaceClient);
  console.log('✓ Injected client createFromNodeStream trace');
} else {
  console.log('Target Client not found');
}

fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
console.log('Done injecting client traces.');
