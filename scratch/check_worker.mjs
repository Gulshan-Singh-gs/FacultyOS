import fs from 'node:fs';

const txt = fs.readFileSync('.open-next/worker.js', 'utf8');
console.log('contains "/dashboard":', txt.includes('"/dashboard"'));
console.log('contains "/(dashboard)/dashboard":', txt.includes('"/(dashboard)/dashboard"'));
console.log('contains "dashboard/page":', txt.includes('dashboard/page'));
