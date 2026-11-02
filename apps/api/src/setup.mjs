import { readFile } from 'node:fs/promises';
import { pool } from './db.mjs';
const schema = await readFile(new URL('../../../database/schema.sql', import.meta.url), 'utf8');
const seed = JSON.parse(await readFile(new URL('../../../database/seed-data.json', import.meta.url), 'utf8'));
const client = await pool.connect();
try {
  await client.query(schema);
  await client.query('BEGIN');
  const insert = async (table, id, payload) => client.query(`INSERT INTO ${table}(id,payload) VALUES($1,$2) ON CONFLICT(id) DO NOTHING`, [id, payload]);
  for (const s of seed.sources) await insert('sources', s.id, s);
  for (const [i, e] of seed.eras.entries()) await client.query('INSERT INTO eras(id,sort_order,payload) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING', [e.id, i, e]);
  for (const l of seed.leaders) {
    const { terms, ...payload } = l;
    await client.query('INSERT INTO leaders(slug,name,sort_order,payload) VALUES($1,$2,$3,$4) ON CONFLICT(slug) DO NOTHING', [l.slug, l.name, l.order, payload]);
    for (const [i, t] of terms.entries()) await client.query('INSERT INTO terms(id,leader_slug,kind,title,start_label,end_label,start_year,end_year,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO NOTHING', [`${l.slug}-${i}`, l.slug, t.kind, t.title, t.start, t.end, t.startYear, t.endYear, t]);
    for (const s of l.sources) await client.query('INSERT INTO leader_sources VALUES($1,$2) ON CONFLICT DO NOTHING', [l.slug, s]);
    for (const e of l.eras) await client.query('INSERT INTO leader_eras VALUES($1,$2) ON CONFLICT DO NOTHING', [l.slug, e]);
  }
  for (const c of seed.congresses) await client.query('INSERT INTO congresses(id,sort_order,payload) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING', [c.id, c.order, c]);
  for (const d of seed.documents) await insert('documents', d.id, d);
  for (const key of ['meta', 'titles', 'discrepancies']) await client.query('INSERT INTO site_content(key,payload) VALUES($1,$2::jsonb) ON CONFLICT(key) DO NOTHING', [key, JSON.stringify(seed[key])]);
  await client.query('COMMIT');
  console.log(`Database ready: ${seed.leaders.length} profiles, ${seed.congresses.length} congresses, ${seed.sources.length} sources.`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error('Database setup failed:', error.message);
  process.exitCode = 1;
} finally { client.release(); await pool.end(); }
