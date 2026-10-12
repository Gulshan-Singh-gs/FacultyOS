import fs from 'fs';

let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const target = 'case 73:(function(e4,t4,r4){';
const replace = 'case 73:(function(e4,t4,r4){console.log("[FACULTYOS_TRACE] CASE 73 called for chunk id:",t4,"r4:",r4);';

if (code.includes(target)) {
  code = code.replaceAll(target, replace);
  console.log('✓ Injected case 73 entry trace');
} else {
  console.log('Target not found');
}

// In case 73 where r4 = c(o2)
const targetC = ',r4=c(o2)){';
const replaceC = ',console.log("[FACULTYOS_TRACE] CASE 73 o2:",JSON.stringify(o2)),r4=c(o2)){console.log("[FACULTYOS_TRACE] CASE 73 c(o2) returned:",typeof r4,r4?.constructor?.name);';

if (code.includes(targetC)) {
  code = code.replaceAll(targetC, replaceC);
  console.log('✓ Injected case 73 c(o2) trace');
} else {
  console.log('Target C not found');
}

fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code, 'utf8');
console.log('Done injecting case 73 traces.');
