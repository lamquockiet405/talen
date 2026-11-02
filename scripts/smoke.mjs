import assert from 'node:assert/strict';
const base = process.env.WEB_URL || 'http://127.0.0.1:3000';
const catalogResponse = await fetch(`${base}/api/catalog`);
assert.equal(catalogResponse.status, 200);
const data = await catalogResponse.json();
const paths = ['/', '/cac-tong-bi-thu', '/dong-thoi-gian', '/cac-ky-dai-hoi', '/tu-lieu', '/nguon-tham-khao', '/so-sanh', '/tim-kiem', '/lich-su-chuc-danh', '/kiem-chung', '/gioi-thieu', ...data.leaders.map(l => `/nhan-vat/${l.slug}`), ...data.congresses.map(c => `/dai-hoi/${c.id}`)];
const seen = new Set();
for (let index = 0; index < paths.length; index += 4) {
  await Promise.all(paths.slice(index, index + 4).map(async path => {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, `${path} must return 200`);
    const html = await response.text();
    assert.ok(html.includes('<html lang="vi"'), `${path} has Vietnamese lang`);
    assert.ok(!html.includes('Kho tư liệu đang gián đoạn.'), `${path} does not render the connection error`);
    for (const [, href] of html.matchAll(/href="(\/[^"?#]*)/g)) if (!href.startsWith('/_next') && !href.startsWith('/api')) seen.add(href);
  }));
}
for (const path of ['/does-not-exist', '/nhan-vat/does-not-exist', '/dai-hoi/does-not-exist']) {
  const response = await fetch(`${base}${path}`);
  // The dynamic page can stream a not-found response with 200 after headers are sent.
  const html = await response.text();
  assert.ok(response.status === 404 || (html.includes('Một trang chưa được viết.') && html.includes('noindex')), `${path} is a proper not-found page`);
}
const search = await fetch(`${base}/api/search?q=nguyen%20van%20linh`);
assert.equal(search.status, 200);
assert.ok((await search.json()).data.some(r => r.title === 'Nguyễn Văn Linh'));
const photo = await fetch(`${base}/images/ho-chi-minh.jpg`);
assert.equal(photo.status, 200); assert.ok(photo.headers.get('content-type').includes('image/jpeg'));
console.log(`HTTP smoke passed: ${paths.length} pages, 3 missing routes, API proxy/search, image.`);
console.log(`Internal linked routes: ${[...seen].filter(p => !p.endsWith('.svg')).length}.`);
