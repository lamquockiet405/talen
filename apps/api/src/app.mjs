import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config.mjs';
import { filterLeaders, readCatalog, searchCatalog } from './catalog.mjs';
export function createApp(pool) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.origins }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', async (_req, res) => {
    try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
    catch { res.status(503).json({ status: 'unavailable', database: 'disconnected' }); }
  });
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/api/catalog', async (_req, res) => res.json(await readCatalog(pool)));
  app.get('/api/leaders', async (req, res) => {
    const { q = '', era = '', year = '', kind = '' } = req.query;
    if ([q, era, year, kind].some(v => typeof v !== 'string') || String(q).length > 200 || (year && !/^(19|20)\d{2}$/.test(year))) return res.status(400).json({ error: 'Bộ lọc không hợp lệ.' });
    const { leaders } = await readCatalog(pool);
    const data = filterLeaders(leaders, { q, era, year, kind });
    res.json({ data, total: data.length });
  });
  app.get('/api/leaders/:slug', async (req, res) => {
    const { leaders } = await readCatalog(pool);
    const leader = leaders.find(l => l.slug === req.params.slug);
    if (!leader) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });
    res.json(leader);
  });
  app.get('/api/search', async (req, res) => {
    if (typeof req.query.q !== 'string' || req.query.q.length > 200) return res.status(400).json({ error: 'Từ khóa phải là chuỗi tối đa 200 ký tự.' });
    const data = searchCatalog(await readCatalog(pool), req.query.q);
    res.json({ data, total: data.length });
  });
  app.get('/api/compare', async (req, res) => {
    if (typeof req.query.slugs !== 'string') return res.status(400).json({ error: 'Hãy chọn 2–3 hồ sơ.' });
    const slugs = [...new Set(req.query.slugs.split(',').filter(Boolean))];
    if (slugs.length < 2 || slugs.length > 3) return res.status(400).json({ error: 'Hãy chọn 2–3 hồ sơ khác nhau.' });
    const { leaders } = await readCatalog(pool);
    const data = slugs.map(slug => leaders.find(l => l.slug === slug));
    if (data.some(l => !l)) return res.status(404).json({ error: 'Một hồ sơ không tồn tại.' });
    res.json({ data });
  });
  for (const name of ['eras', 'congresses', 'documents', 'sources', 'titles']) app.get(`/api/${name}`, async (_req, res) => res.json({ data: (await readCatalog(pool))[name] }));
  app.get('/api/congresses/:id', async (req, res) => {
    const c = (await readCatalog(pool)).congresses.find(c => c.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'Không tìm thấy Đại hội.' });
    res.json(c);
  });
  app.get('/api/audit', async (_req, res) => {
    const catalog = await readCatalog(pool);
    res.json({ data: catalog.leaders.flatMap(l => Object.entries(l.fields).map(([field, fact]) => ({ person: l.name, field, ...fact, status: 'imported' }))), discrepancies: catalog.discrepancies, note: catalog.meta.editorialNote });
  });
  app.use((_req, res) => res.status(404).json({ error: 'Đường dẫn API không tồn tại.' }));
  app.use((error, _req, res, _next) => {
    console.error('API error:', error.message);
    const status = error.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({ error: status === 400 ? 'JSON không hợp lệ.' : 'Không thể tải dữ liệu. Vui lòng thử lại.' });
  });
  return app;
}
