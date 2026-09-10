const fs = require('fs');
const path = require('path');

const { products, categories, inferCategory } = require('./products-data.js');

const PRODUCTS_DIR = path.join(__dirname, 'products');
const TEMPLATE_PATH = path.join(PRODUCTS_DIR, 'product-template.html');
const SITEMAP_PATH = path.join(__dirname, 'sitemap.xml');
const BASE_URL = 'https://shreekrishnatraders.com.np';

function replaceAll(s, from, to) {
  return s.split(from).join(to);
}

function stripTags(s) {
  return (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function cleanForMeta(s) {
  const t = stripTags(s).replace(/[.\s]+$/, '');
  return t.length > 160 ? t.slice(0, 157).trim() + '...' : t;
}

function extractSpecs(product) {
  if (product.specs && product.specs.length > 0) {
    return product.specs;
  }
  const name = (product.name || '').toLowerCase();
  const specs = [];
  const inch = name.match(/(\d+)\s*inch/);
  if (inch) specs.push({ label: 'Blade Length', value: `${inch[1]} inch` });
  const kg = name.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kg) specs.push({ label: 'Weight', value: `${kg[1]} kg` });
  const gram = name.match(/(\d+)\s*gram/);
  if (gram) specs.push({ label: 'Weight', value: `${gram[1]} gram` });
  const materials = ['bone', 'wood', 'leather', 'aluminium', 'glass', 'pakistani', 'plastic'];
  for (const mat of materials) {
    if (name.includes(mat)) {
      specs.push({ label: 'Handle Material', value: mat.charAt(0).toUpperCase() + mat.slice(1) });
      break;
    }
  }
  if (specs.length === 0) specs.push({ label: 'Type', value: product.category || 'Handcrafted' });
  return specs;
}

function renderSpecsHtml(specs) {
  return specs.map(
    (s) => `
                        <div class="spec-item">
                            <span class="spec-label">${s.label}</span>
                            <span class="spec-value">${s.value}</span>
                        </div>`
  ).join('');
}

function buildWhatsAppUrl(name, priceFmt) {
  const text = `Hi, I am interested in the ${name} (NPR ${priceFmt}). Is it available?`;
  return `https://wa.me/9779864563255?text=${encodeURIComponent(text)}`;
}

function buildJsonLd(name, description, absoluteImage, sku, category, priceRaw, pageUrl) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name,
        description: cleanForMeta(description) || name,
        image: absoluteImage,
        brand: { '@type': 'Brand', name: 'Shree Krishna Traders' },
        sku,
        category,
        offers: {
          '@type': 'Offer',
          url: pageUrl,
          priceCurrency: 'NPR',
          price: String(priceRaw),
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: 'Shree Krishna Traders' }
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Products', item: `${BASE_URL}/products.html` },
          { '@type': 'ListItem', position: 3, name, item: pageUrl }
        ]
      },
      {
        '@type': 'Organization',
        name: 'Shree Krishna Traders',
        url: BASE_URL,
        logo: `${BASE_URL}/images/logo.webp`,
        contactPoint: { '@type': 'ContactPoint', telephone: '+9779864563255', contactType: 'customer service' }
      }
    ]
  };
}

function build() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('Template file not found:', TEMPLATE_PATH);
    process.exit(1);
  }
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  if (!fs.existsSync(PRODUCTS_DIR)) fs.mkdirSync(PRODUCTS_DIR, { recursive: true });

  const existing = fs.readdirSync(PRODUCTS_DIR).filter(
    (f) => f.endsWith('.html') && f !== 'product-template.html'
  );
  for (const f of existing) fs.unlinkSync(path.join(PRODUCTS_DIR, f));

  const generated = [];
  for (const product of products) {
    const slug = product.slug || `${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.id}`;
    const fileName = `${slug}.html`;
    const pageUrl = `${BASE_URL}/products/${fileName}`;
    const name = product.name;
    const priceRaw = product.price || 0;
    const priceFmt = priceRaw.toLocaleString('en-US');
    const category = product.category || inferCategory(name) || 'Other Products';
    const sku = `SKU-${product.id != null ? product.id : ''}`;
    const images = (product.images && product.images.length > 0) ? product.images : [product.image || 'images/basket.webp'];
    const relImage = `../${images[0]}`;
    const absoluteImage = `${BASE_URL}/${images[0]}`;
    const thumbnailsHtml = images.map((img) => `<img src="../${img}" alt="${name} - view" data-full="../${img}">`).join('');
    const descriptionHtml = `<p>${product.description || ''}</p>`;
    const specsHtml = renderSpecsHtml(extractSpecs(product));
    const metaDescription = `Buy the ${name} from Shree Krishna Traders. ${cleanForMeta(descriptionHtml)}. NPR ${priceFmt}. Fast delivery across Nepal.`;
    const whatsappUrl = buildWhatsAppUrl(name, priceFmt);
    const jsonLd = JSON.stringify(
      buildJsonLd(name, descriptionHtml, absoluteImage, sku, category, priceRaw, pageUrl),
      null,
      2
    ).split('\n').map((l) => '    ' + l).join('\n');

    let html = template;
    html = replaceAll(html, '{{PAGE_TITLE}}', name);
    html = replaceAll(html, '{{OG_TITLE}}', name);
    html = replaceAll(html, '{{META_DESCRIPTION}}', metaDescription);
    html = replaceAll(html, '{{CANONICAL_URL}}', pageUrl);
    html = replaceAll(html, '{{BREADCRUMB_NAME}}', name);
    html = replaceAll(html, '{{PRODUCT_NAME}}', name);
    html = replaceAll(html, '{{PRODUCT_CATEGORY}}', category);
    html = replaceAll(html, '{{PRODUCT_PRICE}}', priceFmt);
    html = replaceAll(html, '{{PRODUCT_PRICE_RAW}}', String(priceRaw));
    html = replaceAll(html, '{{PRODUCT_ID}}', String(product.id != null ? product.id : ''));
    html = replaceAll(html, '{{PRODUCT_IMAGE}}', images[0]);
    html = replaceAll(html, '{{PRODUCT_DESCRIPTION}}', descriptionHtml);
    html = replaceAll(html, '{{SPECS_ROWS}}', specsHtml);
    html = replaceAll(html, '{{WHATSAPP_URL}}', whatsappUrl);
    html = replaceAll(html, '{{OG_IMAGE}}', absoluteImage);
    html = replaceAll(html, '{{JSON_LD}}', jsonLd);
    html = replaceAll(html, '{{THUMBNAILS_HTML}}', thumbnailsHtml);
    html = replaceAll(html, '{{RELATED_PRODUCTS_HTML}}', '');

    fs.writeFileSync(path.join(PRODUCTS_DIR, fileName), html, 'utf8');
    generated.push({ id: product.id, name, file: fileName, url: pageUrl });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/products.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/checkout.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/login.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/track.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  ${generated
    .map(
      (p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('\n')}
</urlset>
`;

  fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');

  console.log(`Generated ${generated.length} product pages from product-template.html.`);
  console.log(`Updated sitemap.xml with ${generated.length + 5} URLs.`);
}

build();