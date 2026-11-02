import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
const root = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({path: `${root}/.env`,quiet:true});
const prod = process.argv.includes('--production');
const children = [
  spawn(process.execPath, prod ? ['src/server.mjs'] : ['--watch', 'src/server.mjs'], { cwd: `${root}/apps/api`, stdio: 'inherit' }),
  spawn(process.execPath, [`${root}/node_modules/next/dist/bin/next`, prod ? 'start' : 'dev', '--hostname', '127.0.0.1'], { cwd: `${root}/apps/web`, stdio: 'inherit' }),
];
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; for (const child of children) child.kill(); setTimeout(() => process.exit(code), 500); }
for (const child of children) { child.on('error', e => { console.error(e.message); stop(1); }); child.on('exit', code => { if (!stopping) stop(code || 0); }); }
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
