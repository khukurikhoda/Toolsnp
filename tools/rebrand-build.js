const fs = require('fs');
for (const f of ['products/product-template.html', 'build-products.js']) {
  const s = fs.readFileSync(f, 'utf8');
  const count = (s.match(/Tools Nepal/g) || []).length;
  const n = s.split('Tools Nepal').join('Shree Krishna Traders');
  fs.writeFileSync(f, n);
  console.log(f + ': replaced ' + count + ' occurrence(s)');
}
