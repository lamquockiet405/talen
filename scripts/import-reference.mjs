import { readFile, writeFile, mkdir } from 'node:fs/promises';
const html = await readFile(new URL('../reference.html', import.meta.url), 'utf8');
const raw = JSON.parse(html.match(/<script type="application\/json" id="site-data">([\s\S]*?)<\/script>/)[1]);
const sourceIds = value => Array.isArray(value) ? value : String(value || '').split(/\s+/).filter(Boolean);
const fact = f => f ? { text: f.t, sources: sourceIds(f.s), ...(f.diff ? { difference: f.diff } : {}) } : null;
const facts = fs => (fs || []).map(f => ({ ...fact(f), date: f.d || '' }));
const data = {
  meta: { title: 'Dấu ấn lịch sử', subtitle: 'Các đời Tổng Bí thư Đảng Cộng sản Việt Nam',
    period: '1930–2026', importedFrom: 'https://vrn202-g3.vercel.app/',
    referenceUpdated: raw.meta.updated, importedAt: '2026-11-02',
    editorialNote: 'Dữ liệu được nhập từ website tham khảo. Các liên kết nguồn được giữ để người đọc đối chiếu; bản này chưa kiểm chứng độc lập toàn bộ dữ kiện.' },
  eras: raw.eras.map(e => ({ id: e.id, label: e.label, title: e.title, events: facts(e.anchors) })),
  leaders: raw.leaders.map((l, i) => ({
    slug: l.slug, name: l.name, initials: l.mono, order: i + 1,
    summary: `${l.name} · ${[...new Set(l.terms.map(t => t.title))].join(', ')}.`,
    fields: Object.fromEntries(Object.entries(l.fields).filter(([, v]) => v && !Array.isArray(v)).map(([k, v]) => [k, fact(v)])),
    aliases: facts(l.fields.aliases),
    terms: l.terms.map(t => ({ kind: t.kind, title: t.title, start: t.start, end: t.end || 'Nay', startYear: t.sy, endYear: t.ey || 2026.84, congress: t.khoa, sources: sourceIds(t.s), appointment: t.how || '', ...(t.diff ? { difference: t.diff } : {}) })),
    timeline: facts(l.timeline), events: facts(l.leadership.events), positions: facts(l.positions),
    context: { title: l.context.label, events: facts(l.context.items) },
    eras: l.eras, sources: l.sourceIds, documents: l.docs,
  })),
  congresses: raw.congresses.map((c, i) => ({ id: c.id, order: i, ordinal: c.ord || '', name: c.name, year: c.y, time: fact(c.time), place: fact(c.place), theme: fact(c.theme), delegates: fact(c.delegates), content: facts(c.content), leaders: c.leaderSlugs || [], documents: c.docs || [] })),
  documents: raw.documents.map(d => ({ id: d.id, name: d.name, date: d.date, issuer: d.issuer, description: fact(d.desc), era: d.era, people: d.people || [], url: d.url || d.fullUrl || '', sources: sourceIds(d.desc?.s) })),
  sources: raw.sources.map(s => ({ id: s.id, title: s.title, organization: s.org, date: s.date, url: s.url, accessed: s.accessed, group: s.group, people: s.people || [], eras: s.eras || [], status: 'imported' })),
  titles: raw.titles.map(t => ({ name: t.name, period: t.period, kind: t.kind, basis: facts(t.basis) })),
  discrepancies: raw.discrepancies.map(d => ({ topic: d.topic, people: d.people, variants: d.variants.map(v => ({ text: v.t, sources: sourceIds(v.s) })), handling: d.handling })),
};
await mkdir(new URL('../database/', import.meta.url), { recursive: true });
await writeFile(new URL('../database/seed-data.json', import.meta.url), JSON.stringify(data, null, 2) + '\n');
console.log(`Imported ${data.leaders.length} leaders, ${data.congresses.length} congresses, ${data.sources.length} sources.`);
