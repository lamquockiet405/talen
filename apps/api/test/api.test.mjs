import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.mjs';
import { pool } from '../src/db.mjs';
let server;
let base;
before(async () => { await pool.query('SELECT 1'); server = createApp(pool).listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await pool.end(); });
const get = async path => { const response = await fetch(`${base}${path}`); return { status: response.status, body: await response.json() }; };
test('health verifies a real PostgreSQL connection', async () => { const r = await get('/api/health'); assert.equal(r.status, 200); assert.equal(r.body.database, 'connected'); });
test('catalog assembles relational terms, sources and eras', async () => {
  const { body } = await get('/api/catalog');
  assert.equal(body.leaders.length, 13); assert.equal(body.sources.length, 20);
  assert.ok(body.leaders.every(l => l.terms.length && l.terms.every(t => typeof t.startYear === 'number')));
  const sources = new Set(body.sources.map(s => s.id));
  assert.ok(body.leaders.every(l => l.sources.every(s => sources.has(s))));
  assert.ok(body.leaders.every(l => l.eras.length));
  assert.ok(body.meta.editorialNote.includes('chưa kiểm chứng độc lập'));
});
test('Vietnamese search accepts unaccented names', async () => { const r = await get('/api/search?q=ho%20chi%20minh'); assert.equal(r.status, 200); assert.ok(r.body.data.some(x => x.title === 'Hồ Chí Minh' && x.type === 'Nhân vật')); });
test('combined year and title filters include overlapping handovers', async () => {
  const { body } = await get('/api/leaders?year=1986&kind=tbt');
  for (const name of ['Trường Chinh', 'Lê Duẩn', 'Nguyễn Văn Linh']) assert.ok(body.data.some(l => l.name === name));
  assert.equal((await get('/api/leaders?era=e1&year=2024')).body.total, 0);
});
test('malformed filters and search arrays are rejected', async () => {
  for (const path of ['/api/leaders?year=abc', '/api/leaders?q=a&q=b', '/api/search?q=a&q=b', `/api/search?q=${'a'.repeat(201)}`]) assert.equal((await get(path)).status, 400);
});
test('profile and congress endpoints return real records or 404', async () => {
  assert.equal((await get('/api/leaders/tran-phu')).body.name, 'Trần Phú');
  assert.equal((await get('/api/leaders/not-a-profile')).status, 404);
  const { body } = await get('/api/congresses');
  assert.equal((await get(`/api/congresses/${body.data[0].id}`)).status, 200);
  assert.equal((await get('/api/congresses/missing')).status, 404);
});
test('compare validates count, uniqueness and unknown slugs', async () => {
  assert.equal((await get('/api/compare?slugs=tran-phu,le-duan')).body.data.length, 2);
  assert.equal((await get('/api/compare?slugs=tran-phu,tran-phu')).status, 400);
  assert.equal((await get('/api/compare?slugs=tran-phu,le-duan,truong-chinh,ho-chi-minh')).status, 400);
  assert.equal((await get('/api/compare?slugs=tran-phu,missing')).status, 404);
});
test('quotes and SQL syntax in input are treated as data', async () => { const r = await get(`/api/leaders?q=${encodeURIComponent("'; DROP TABLE leaders; --")}`); assert.equal(r.status, 200); assert.equal(r.body.total, 0); assert.equal((await get('/api/catalog')).body.leaders.length, 13); });
test('audit preserves source references and imported status', async () => { const { body } = await get('/api/audit'); assert.ok(body.data.length > 50); assert.ok(body.data.every(row => row.status === 'imported' && Array.isArray(row.sources))); assert.ok(body.discrepancies.length); });
test('missing routes return JSON without leaking stack traces', async () => { const r = await get('/api/missing'); assert.equal(r.status, 404); assert.deepEqual(Object.keys(r.body), ['error']); });
