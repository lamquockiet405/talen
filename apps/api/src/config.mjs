import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
export const config = {
  port: Number(process.env.API_PORT || 4000),
  host: process.env.API_HOST || '127.0.0.1',
  databaseUrl: process.env.DATABASE_URL,
  origins: (process.env.WEB_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000').split(','),
};
