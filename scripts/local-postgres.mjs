import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import net from 'node:net';
const root = fileURLToPath(new URL('../', import.meta.url));
const local = join(root, '.local');
const data = join(local, 'postgres');
const port = 55432;
let bin = process.env.PG_BIN;
if (!bin && process.platform === 'win32') {
  const base = 'C:/Program Files/PostgreSQL';
  if (existsSync(base)) bin = join(base, readdirSync(base).filter(v => /^\d+$/.test(v)).sort((a,b) => +b-+a)[0], 'bin');
}
const executable = name => bin ? join(bin, `${name}${process.platform === 'win32' ? '.exe' : ''}`) : name;
const run = (name, args, options = {}) => {
  const r = spawnSync(executable(name), args, { encoding: 'utf8', cwd: root, ...options });
  if (r.error || r.status !== 0) throw new Error(`${name}: ${r.error?.message || r.stderr || r.stdout}`);
  return r.stdout || '';
};
if (process.argv.includes('--stop')) {
  if (existsSync(join(data, 'postmaster.pid'))) console.log(run('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']));
  else console.log('Project PostgreSQL is already stopped.');
  process.exit(0);
}
mkdirSync(local, { recursive: true });
const envPath = join(root, '.env');
let password;
if (existsSync(envPath)) {
  const match = readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.+)$/m);
  if (!match) throw new Error('Existing .env has no DATABASE_URL. Configure it manually; it will not be overwritten.');
  const url = new URL(match[1].trim());
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== String(port) || url.username !== 'museum' || url.pathname !== '/museum') throw new Error('Existing .env points to another database. Use npm run db:setup for it, or configure the isolated local database explicitly.');
  password = decodeURIComponent(url.password);
} else {
  password = randomBytes(24).toString('hex');
  writeFileSync(envPath, `DATABASE_URL=postgresql://museum:${password}@127.0.0.1:${port}/museum\nAPI_PORT=4000\nWEB_ORIGIN=http://localhost:3000,http://127.0.0.1:3000\nAPI_URL=http://127.0.0.1:4000\n`, { mode: 0o600 });
}
if (!existsSync(join(data, 'PG_VERSION'))) {
  const passwordFile = join(local, 'init-password');
  writeFileSync(passwordFile, password, { mode: 0o600 });
  try { console.log(run('initdb', ['-D', data, '-U', 'museum', '--auth=scram-sha-256', '--encoding=UTF8', '--locale=C', `--pwfile=${passwordFile}`])); }
  finally { rmSync(passwordFile, { force: true }); }
}
if (!existsSync(join(data, 'postmaster.pid'))) {
  const available = await new Promise(resolve => { const s = net.createServer(); s.once('error', () => resolve(false)); s.listen(port, '127.0.0.1', () => s.close(() => resolve(true))); });
  if (!available) throw new Error(`Port ${port} is occupied. No existing database was changed.`);
  run('pg_ctl', ['-D', data, '-l', join(local, 'postgres.log'), '-o', `-p ${port} -h 127.0.0.1`, '-w', 'start'], { stdio: 'ignore', timeout: 65000 });
}
const dbs = run('psql', ['-h', '127.0.0.1', '-p', String(port), '-U', 'museum', '-d', 'postgres', '-Atc', "SELECT datname FROM pg_database WHERE datname='museum'"], { env: { ...process.env, PGPASSWORD: password } });
if (!dbs.trim()) run('createdb', ['-h', '127.0.0.1', '-p', String(port), '-U', 'museum', 'museum'], { env: { ...process.env, PGPASSWORD: password } });
console.log(`Isolated PostgreSQL ready on 127.0.0.1:${port}. Connection is stored in .env (not printed).`);
