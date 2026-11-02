export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export async function readCatalog(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const leaders = await client.query(`SELECT l.payload || jsonb_build_object('name',l.name,'terms',COALESCE((SELECT jsonb_agg(t.payload || jsonb_build_object('title',t.title,'kind',t.kind,'start',t.start_label,'end',t.end_label,'startYear',t.start_year,'endYear',t.end_year) ORDER BY t.start_year) FROM terms t WHERE t.leader_slug=l.slug),'[]'::jsonb), 'eras',COALESCE((SELECT jsonb_agg(le.era_id) FROM leader_eras le WHERE le.leader_slug=l.slug),'[]'::jsonb), 'sources',COALESCE((SELECT jsonb_agg(ls.source_id ORDER BY ls.source_id) FROM leader_sources ls WHERE ls.leader_slug=l.slug),'[]'::jsonb)) AS payload FROM leaders l ORDER BY l.sort_order`);
    const result = { leaders: leaders.rows.map(r => r.payload) };
    for (const [table, order] of [['eras', 'sort_order'], ['congresses', 'sort_order'], ['documents', 'id'], ['sources', 'id']]) {
      result[table] = (await client.query(`SELECT payload FROM ${table} ORDER BY ${order}`)).rows.map(r => r.payload);
    }
    for (const row of (await client.query('SELECT key,payload FROM site_content')).rows) result[row.key] = row.payload;
    await client.query('COMMIT');
    return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export function filterLeaders(leaders, query) {
  return leaders.filter(l => {
    const haystack = normalize(`${l.name} ${(l.aliases || []).map(a => a.text).join(' ')} ${l.fields.realName?.text || ''}`);
    return (!query.q || haystack.includes(normalize(query.q))) &&
      (!query.era || l.eras.includes(query.era)) &&
      (!query.kind || l.terms.some(t => t.kind === query.kind)) &&
      (!query.year || l.terms.some(t => Math.floor(t.startYear) <= Number(query.year) && Math.floor(t.endYear) >= Number(query.year)));
  });
}
export function searchCatalog(catalog, query) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const index = [
    ...catalog.leaders.map(l => ({ type: 'Nhân vật', title: l.name, description: l.terms.map(t => `${t.title} · ${t.start}–${t.end}`).join('; '), href: `/nhan-vat/${l.slug}`, extra: `${l.fields.hometown?.text || ''} ${(l.aliases || []).map(a => a.text).join(' ')} ${l.terms.map(t => t.congress.join(' ')).join(' ')}` })),
    ...catalog.leaders.flatMap(l => l.timeline.map(e => ({ type: 'Sự kiện', title: e.text, description: `${e.date} · ${l.name}`, href: `/nhan-vat/${l.slug}#hanh-trinh`, extra: '' }))),
    ...catalog.congresses.map(c => ({ type: 'Đại hội', title: c.name, description: `${c.time?.text || ''} · ${c.place?.text || ''}`, href: `/dai-hoi/${c.id}`, extra: c.ordinal })),
    ...catalog.documents.map(d => ({ type: 'Tư liệu', title: d.name, description: `${d.date} · ${d.issuer}`, href: `/tu-lieu#${d.id}`, extra: d.description?.text || '' })),
    ...catalog.sources.map(s => ({ type: 'Nguồn', title: s.title, description: s.organization, href: `/nguon-tham-khao#${s.id}`, extra: s.id })),
  ];
  return index.filter(item => tokens.every(token => normalize(`${item.title} ${item.description} ${item.extra}`).includes(token))).map(({ extra, ...item }) => item).slice(0, 100);
}
