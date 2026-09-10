const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'products');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'product-template.html');
const bad = [];
for (const f of files) {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  if (/Tools Nepal/.test(s)) bad.push(f + ': Tools Nepal');
  const tok = s.match(/{{[A-Z_]+}}/g);
  if (tok) bad.push(f + ': tokens ' + tok.join(','));
  const m = s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) { bad.push(f + ': no JSON-LD'); continue; }
  try { JSON.parse(m[1]); } catch (e) { bad.push(f + ': JSON-LD ' + e.message); }
  for (const id of ['relatedProductsGrid', 'popularGrid', 'featuredGrid', 'recentlyViewedGrid', 'categoryCards', 'addToCartBtn', 'cartSidebar']) {
    if (!s.includes('id="' + id + '"')) bad.push(f + ': missing #' + id);
  }
  if (!/Shree Krishna Traders/.test(s)) bad.push(f + ': no brand');
  if (!s.includes('trust-badges')) bad.push(f + ': no trust badges');
  if (!s.includes('product-details')) bad.push(f + ': no product details');
  if (!s.includes('../products-data.js') || !s.includes('../script.js')) bad.push(f + ': missing scripts');
}
console.log(bad.length ? 'ISSUES:\n' + bad.join('\n') : 'ALL ' + files.length + ' PAGES VALID');
