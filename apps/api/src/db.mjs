import pg from 'pg';
import { config } from './config.mjs';
if (!config.databaseUrl) throw new Error('Missing DATABASE_URL. Run npm run db:local or configure .env first.');
export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
pool.on('error', error => console.error('PostgreSQL pool error:', error.message));
