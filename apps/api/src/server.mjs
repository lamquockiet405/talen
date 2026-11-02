import { createApp } from './app.mjs';
import { pool } from './db.mjs';
import { config } from './config.mjs';
await pool.query('SELECT 1');
const server = createApp(pool).listen(config.port, config.host, () => console.log(`Express API: http://${config.host}:${config.port}`));
async function shutdown() { server.close(async () => { await pool.end(); process.exit(0); }); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
