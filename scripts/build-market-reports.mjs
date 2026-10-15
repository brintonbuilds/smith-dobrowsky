/* Monthly market report pages — builds permanent, indexable pages from Local Insight.

   Monthly workflow (after local-insight.html has been updated with the new month):
     node scripts/build-market-reports.mjs
     node scripts/generate-seo-files.mjs
     node scripts/validate-site.mjs

   What it does:
   1. Reads the edition currently on local-insight.html and, if that month is not yet in
      data/market-reports.json, saves it there (the JSON is the permanent archive).
   2. Writes one report page per city per month, e.g. burlington-market-report-september-2026.html,
      plus an evergreen hub per city (burlington-real-estate-market.html) with the latest
      snapshot, a trend table and links to every report.
   3. Fills the report links inside local-insight.html (between REPORT-LINKS markers).
   4. Registers every page in site.config.json so the sitemap and validator pick them up.

   Import an older edition from a saved copy of local-insight.html:
     node scripts/build-market-reports.mjs --import path/to/local-insight.html 2026-07 2026-09-16
*/
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://yourrealpro.com';
const DATA_FILE = path.join(root, 'data/market-reports.json');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CITIES = {
  burlington: {
    name: 'Burlington',
    image: 'assets/burlington-waterfront-pier-sunset.webp',
    imageAlt: 'Burlington waterfront pier and lakeside trail at sunset on Lake Ontario, Burlington, Ontario',
    imageSize: [1536, 1024],
    intro: 'Burlington&rsquo;s housing market can move differently from one neighbourhood to the next &mdash; from the lakefront and Aldershot to Millcroft and Alton Village. Each month, Geoff Smith breaks down the latest ITSO data for Burlington detached homes, townhouses and condos: prices, sales, inventory and days on market, and what it all means if you are buying or selling.'
  },
  hamilton: {
    name: 'Hamilton',
    image: 'assets/burlington-hamilton-escarpment-regional-perspective.webp',
    imageAlt: 'The Niagara Escarpment overlooking Hamilton, Ontario',
    imageSize: [1821, 864],
    intro: 'Hamilton is many markets in one &mdash; the lower city, the Mountain, Westdale, Dundas, Ancaster and Stoney Creek can all behave differently. Each month, Geoff Smith breaks down the latest ITSO data for Hamilton detached homes, townhouses and condos: prices, sales, inventory and days on market, and what it all means if you are buying or selling.'
  }
};

/* ── helpers ─────────────────────────────────────────────────────────── */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', minus: '−', middot: '·', trade: '™', nbsp: ' ', darr: '↓', uarr: '↑', harr: '↔', rarr: '→' };
const plain = (html) => String(html)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCharCode(+e.slice(1)) : (ENTITIES[e] ?? m))
  .replace(/\s+/g, ' ')
  .trim();
const attr = (text) => plain(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const one = (src, re, label) => {
  const m = src.match(re);
  if (!m) throw new Error(`Could not find ${label}`);
  return m[1].trim();
};
const monthLabel = (ym) => `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
const monthSlug = (ym) => `${MONTHS[+ym.slice(5, 7) - 1].toLowerCase()}-${ym.slice(0, 4)}`;
const reportFile = (city, ym) => `${city}-market-report-${monthSlug(ym)}.html`;
const hubFile = (city) => `${city}-real-estate-market.html`;
const change = (v) => {
  const t = plain(v);
  const n = t.replace(/^[+−-]/, '');
  return /^[−-]/.test(t) ? `down ${n}` : /^\+/.test(t) ? `up ${n}` : t;
};

/* ── extract one edition from local-insight.html ─────────────────────── */

function extractCity(panel) {
  const signals = [...panel.matchAll(/<li class="li-intelligence__quicksignal">([\s\S]*?)<\/li>/g)].map(([, li]) => ({
    dir: /quicksignal-arrow--down/.test(li) ? 'down' : /quicksignal-arrow--up/.test(li) ? 'up' : 'flat',
    arrow: one(li, /quicksignal-arrow[^"]*" aria-hidden="true">([\s\S]*?)<\/span>/, 'signal arrow'),
    name: one(li, /quicksignal-name">([\s\S]*?)<\/span>/, 'signal name'),
    status: one(li, /quicksignal-status">([\s\S]*?)<\/span>/, 'signal status')
  }));

  const meaning = (key) => {
    const block = one(panel, new RegExp(`data-meaning-content="${key}"[^>]*>([\\s\\S]*?)</ul>`), `${key} guidance`);
    return {
      headline: one(block, /meaning-headline">([\s\S]*?)<\/h3>/, `${key} headline`),
      body: one(block, /meaning-body">([\s\S]*?)<\/p>/, `${key} body`),
      list: [...block.matchAll(/<li><span class="li-intelligence__meaning-list-label">([\s\S]*?)<\/span>([\s\S]*?)<\/li>/g)].map((m) => [m[1].trim(), m[2].trim()])
    };
  };

  const tables = [...panel.matchAll(/class="li-intelligence__deeper-table">\s*<p class="li-intelligence__deeper-table-label">([\s\S]*?)<\/p>\s*<dl[^>]*>([\s\S]*?)<\/dl>/g)]
    .map(([, label, dl]) => ({
      label: label.trim(),
      rows: [...dl.matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)].map((m) => [m[1].trim(), m[2].trim()])
    }));
  if (tables.length !== 2) throw new Error(`Expected 2 data tables, found ${tables.length}`);

  return {
    tagline: one(panel, /li-cover__tagline">([\s\S]*?)<\/p>/, 'tagline'),
    score: +one(panel, /data-gauge-score="(\d+)"/, 'score'),
    label: one(panel, /glance-label">([\s\S]*?)<\/p>/, 'label'),
    sublabel: one(panel, /glance-sublabel">([\s\S]*?)<\/p>/, 'sublabel'),
    note: one(panel, /glance-note">([\s\S]*?)<\/p>/, 'note'),
    signals,
    buying: meaning('buying'),
    selling: meaning('selling'),
    analysis: [...panel.matchAll(/deeper-methodology">([\s\S]*?)<\/p>/g)].map((m) => m[1].trim()).slice(1),
    tables,
    backdrop: one(panel, /deeper-backdrop">([\s\S]*?)<\/p>/, 'backdrop')
  };
}

function extractEdition(html, ym) {
  const label = monthLabel(ym);
  const edition = { month: ym, cities: {} };
  for (const key of Object.keys(CITIES)) {
    const start = html.indexOf(`id="panel-${key}"`);
    const end = html.indexOf(`<!-- /panel-${key} -->`, start);
    if (start < 0 || end < 0) throw new Error(`Panel ${key} not found`);
    const panel = html.slice(start, end);
    const city = extractCity(panel);
    const archive = [...panel.matchAll(/archive-date">([\s\S]*?)<\/span>\s*<p class="li-intelligence__archive-text">([\s\S]*?)<\/p>/g)]
      .find((m) => plain(m[1]) === label);
    city.summary = archive ? archive[2].trim() : plain(city.note);
    edition.cities[key] = city;
  }
  return edition;
}

const currentMonth = (html) => {
  const m = html.match(/<title>(\w+) (\d{4}) Local Market Intelligence/);
  if (!m) throw new Error('Could not read the current month from the local-insight.html title');
  return `${m[2]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, '0')}`;
};

/* ── shared page chrome (taken from local-insight.html so it stays in sync) ── */

function chrome(li) {
  const head = li.slice(0, li.indexOf('</head>'));
  return {
    css: [...head.matchAll(/<link rel="stylesheet" href="css\/[^"]+" \/>/g)].map((m) => m[0]).join('\n  '),
    fonts: one(head, /(<link href="https:\/\/fonts\.googleapis\.com[^>]+>)/, 'font link'),
    analytics: one(head, /(<script src="js\/analytics\.js[^"]*"><\/script>)/, 'analytics script'),
    nav: li.slice(li.indexOf('<nav class="nav'), li.indexOf('<main>')).trim(),
    footer: li.slice(li.indexOf('<footer class="footer">'), li.indexOf('</footer>') + '</footer>'.length)
  };
}

function page({ c, file, title, description, image, imageAlt, imageSize, jsonld, body }) {
  const url = `${BASE}/${file}`;
  return `<!DOCTYPE html>
<html lang="en-CA">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${attr(description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="en_CA" />
  <meta property="og:site_name" content="The Smith Dobrowsky Team" />
  <meta property="og:title" content="${attr(title)}" />
  <meta property="og:description" content="${attr(description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${BASE}/${image}" />
  <meta property="og:image:width" content="${imageSize[0]}" />
  <meta property="og:image:height" content="${imageSize[1]}" />
  <meta property="og:image:alt" content="${attr(imageAlt)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${attr(title)}" />
  <meta name="twitter:description" content="${attr(description)}" />
  <meta name="twitter:image" content="${BASE}/${image}" />
  <meta name="theme-color" content="#08182e" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  ${c.fonts}
  ${c.analytics}
  <link rel="icon" href="favicon.ico" sizes="any" />
  ${c.css}
  <link rel="stylesheet" href="css/report.css?v=20261014b" />
  <script src="js/nav.js" defer></script>
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>
</head>
<body class="interior-page report-page">

  ${c.nav}

  <main>
${body}
  </main>

  ${c.footer}

</body>
</html>
`;
}

const team = { '@type': 'RealEstateAgent', '@id': `${BASE}/#team`, name: 'The Smith Dobrowsky Team', url: `${BASE}/` };
const geoff = { '@type': 'Person', '@id': `${BASE}/#geoff-smith`, name: 'Geoff Smith', jobTitle: 'Realtor', worksFor: { '@id': `${BASE}/#team` } };
const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${BASE}/${href}` }))
});
const crumbHtml = (items) => `<nav class="rp-crumbs" aria-label="Breadcrumb"><ol>${items.map(([name, href], i) =>
  i === items.length - 1 ? `<li aria-current="page">${name}</li>` : `<li><a href="${href}">${name}</a></li>`).join('')}</ol></nav>`;

/* ── report building blocks ──────────────────────────────────────────── */

const row = (table, name) => (table.rows.find((r) => plain(r[0]).toLowerCase() === name) || [, ''])[1];
function keyStats(city) {
  const [d, k] = city.tables;
  return {
    median: row(d, 'median sale price'), medianChg: row(d, 'median price change'),
    sales: row(d, 'sales'), salesChg: row(d, 'sales change'),
    dom: row(d, 'days on market'), domChg: row(d, 'days-on-market change'),
    moi: row(d, 'months of inventory'), moiChg: row(d, 'months of inventory change'),
    cMedian: row(k, 'median sale price'), cMedianChg: row(k, 'median price change'),
    cDom: row(k, 'days on market'), cDomChg: row(k, 'days-on-market change')
  };
}

const scoreCard = (city) => `
        <div class="rp-score">
          <p class="rp-label">Market Balance Index&trade;</p>
          <p class="rp-score__value">${city.score}<span>/ 100</span></p>
          <div class="rp-score__bar" aria-hidden="true"><span style="width:${city.score}%"></span></div>
          <div class="rp-score__ends" aria-hidden="true"><span>Buyer&rsquo;s market</span><span>Seller&rsquo;s market</span></div>
          <p class="rp-score__label">${city.label}</p>
          <p class="rp-score__sub">${city.sublabel}</p>
          <p class="rp-score__note">${city.note}</p>
        </div>`;

const signalList = (city) => `
        <ul class="rp-signals" aria-label="Market signals">${city.signals.map((s) => `
          <li><span class="rp-signals__arrow rp-signals__arrow--${s.dir}" aria-hidden="true">${s.arrow}</span><span class="rp-signals__name">${s.name}</span><span class="rp-signals__status">${s.status}</span></li>`).join('')}
        </ul>`;

const statGrid = (s) => `
        <dl class="rp-stats">
          <div><dt>Detached median price</dt><dd>${s.median}</dd><dd class="rp-stats__chg">${change(s.medianChg)} year over year</dd></div>
          <div><dt>Detached sales</dt><dd>${s.sales}</dd><dd class="rp-stats__chg">${change(s.salesChg)}</dd></div>
          <div><dt>Days on market</dt><dd>${s.dom}</dd><dd class="rp-stats__chg">${change(s.domChg)}</dd></div>
          <div><dt>Months of inventory</dt><dd>${s.moi}</dd><dd class="rp-stats__chg">${change(s.moiChg)}</dd></div>
        </dl>`;

function faqs(name, label, city) {
  const s = keyStats(city);
  return [
    [`Is ${name} a buyer&rsquo;s or seller&rsquo;s market in ${label}?`,
      `${name} scored ${city.score} out of 100 on the Smith Dobrowsky Market Balance Index&trade; for ${label}: ${plain(city.label).toLowerCase()}, ${plain(city.sublabel).toLowerCase()}. ${city.note}`],
    [`What was the median price of a detached home in ${name} in ${label}?`,
      `The median detached sale price in ${name} was ${s.median}, ${change(s.medianChg)} from a year earlier. The townhouse and condo median was ${s.cMedian} (${change(s.cMedianChg)}).`],
    [`How long are homes taking to sell in ${name}?`,
      `In ${label}, detached homes in ${name} averaged ${s.dom} days on market (${change(s.domChg)} year over year), and townhouses and condos averaged ${s.cDom} days (${change(s.cDomChg)}).`]
  ];
}
const faqHtml = (list) => `
      <section class="rp-section rp-faq" aria-labelledby="rp-faq-heading">
        <h2 class="rp-h2" id="rp-faq-heading">Common questions</h2>${list.map(([q, a]) => `
        <details class="rp-faq__item"><summary>${q}</summary><p>${a}</p></details>`).join('')}
      </section>`;
const faqLd = (list) => ({ '@type': 'FAQPage', mainEntity: list.map(([q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) });

const cta = (name) => `
      <section class="rp-cta">
        <h2 class="rp-cta__heading">Want Geoff&rsquo;s read on your ${name} street?</h2>
        <p>City-wide numbers only tell part of the story. Geoff can explain how this month&rsquo;s market applies to your home, your search or your neighbourhood.</p>
        <div class="rp-cta__actions">
          <a href="contact.html" class="rp-cta__btn">Ask About ${name} <span aria-hidden="true">&rarr;</span></a>
          <a href="local-insight.html#li-signup-heading" class="rp-link">Get next month&rsquo;s report by email <span aria-hidden="true">&rarr;</span></a>
        </div>
      </section>`;

/* ── report page ─────────────────────────────────────────────────────── */

function reportPage(c, key, ed, prev, next) {
  const meta = CITIES[key];
  const city = ed.cities[key];
  const label = monthLabel(ed.month);
  const file = reportFile(key, ed.month);
  const s = keyStats(city);
  const title = `${meta.name} Real Estate Market Report, ${label} | Smith Dobrowsky`;
  const description = `${meta.name} housing market, ${label}: detached median ${s.median} (${change(s.medianChg)}), ${s.sales} sales, ${s.dom} days on market. ${plain(city.label)}, ${city.score}/100 on the Market Balance Index.`;
  const list = faqs(meta.name, label, city);
  const crumbItems = [['Home', 'index.html'], ['Local Insight', 'local-insight.html'], [`${meta.name} Market`, hubFile(key)], [label, file]];
  const table = (t) => `
          <div class="rp-table-wrap">
            <table class="rp-table">
              <caption>${t.label}</caption>
              <tbody>${t.rows.map(([k, v]) => `
                <tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>`;
  const guide = (who, g) => `
          <article class="rp-guide">
            <p class="rp-label">If you&rsquo;re ${who}</p>
            <h3 class="rp-guide__headline">${g.headline}</h3>
            <p>${g.body}</p>
            <dl class="rp-guide__list">${g.list.map(([k, v]) => `
              <div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
            </dl>
          </article>`;

  const body = `
    <header class="rp-header">
      <div class="rp-wrap">
        ${crumbHtml(crumbItems)}
        <p class="rp-eyebrow">${meta.name} Market Report &middot; ${label}</p>
        <h1 class="rp-h1">${meta.name} Real Estate Market Report <em>${label}</em></h1>
        <p class="rp-tagline">${city.tagline}</p>
        <p class="rp-byline">By Geoff Smith, The Smith Dobrowsky Team &middot; Published <time datetime="${ed.published}">${new Date(ed.published + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</time></p>
      </div>
    </header>

    <div class="rp-wrap rp-body">

      <section class="rp-section rp-snapshot" aria-label="${label} snapshot">${scoreCard(city)}
        <div class="rp-snapshot__side">
          <p class="rp-label">At a glance</p>${signalList(city)}${statGrid(s)}
        </div>
      </section>

      <section class="rp-section" aria-labelledby="rp-analysis-heading">
        <h2 class="rp-h2" id="rp-analysis-heading">What happened in ${label}</h2>
        ${city.analysis.map((p) => `<p class="rp-lead">${p}</p>`).join('\n        ')}
      </section>

      <section class="rp-section" aria-labelledby="rp-guide-heading">
        <h2 class="rp-h2" id="rp-guide-heading">What it means for you</h2>
        <div class="rp-guides">${guide('buying', city.buying)}${guide('selling', city.selling)}
        </div>
      </section>

      <section class="rp-section" aria-labelledby="rp-data-heading">
        <h2 class="rp-h2" id="rp-data-heading">The full ${label} data</h2>
        <div class="rp-tables">${city.tables.map(table).join('')}
        </div>
        <p class="rp-source">${city.backdrop}</p>
        <p class="rp-source">The Smith Dobrowsky Market Balance Index&trade; scores conditions from 0 (buyer&rsquo;s market) to 100 (seller&rsquo;s market) using supply, demand, pricing, competition and momentum.</p>
      </section>
${faqHtml(list)}

      <nav class="rp-pager" aria-label="More ${meta.name} reports">
        ${prev ? `<a href="${reportFile(key, prev.month)}" rel="prev"><span>&larr; Previous</span>${monthLabel(prev.month)}</a>` : '<span></span>'}
        <a href="${hubFile(key)}" class="rp-pager__all">All ${meta.name} reports</a>
        ${next ? `<a href="${reportFile(key, next.month)}" rel="next"><span>Next &rarr;</span>${monthLabel(next.month)}</a>` : '<span></span>'}
      </nav>
${cta(meta.name)}
    </div>`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${BASE}/${file}#article`,
        headline: `${meta.name} Real Estate Market Report, ${label}`,
        description: plain(description),
        datePublished: ed.published,
        dateModified: ed.modified || ed.published,
        author: geoff,
        publisher: team,
        image: `${BASE}/${meta.image}`,
        mainEntityOfPage: `${BASE}/${file}`,
        about: { '@type': 'City', name: meta.name, containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario' } },
        inLanguage: 'en-CA'
      },
      crumbs(crumbItems),
      faqLd(list)
    ]
  };
  return { file, html: page({ c, file, title, description, image: meta.image, imageAlt: meta.imageAlt, imageSize: meta.imageSize, jsonld, body }), published: ed.published };
}

/* ── evergreen city hub ──────────────────────────────────────────────── */

function hubPage(c, key, editions) {
  const meta = CITIES[key];
  const file = hubFile(key);
  const latest = editions[editions.length - 1];
  const city = latest.cities[key];
  const label = monthLabel(latest.month);
  const s = keyStats(city);
  const title = `${meta.name} Real Estate Market: Prices, Trends &amp; Monthly Reports`;
  const description = `Latest ${meta.name} housing market data (${label}): detached median ${s.median}, ${s.dom} days on market, Market Balance Index ${city.score}/100. Monthly reports from Geoff Smith.`;
  const list = faqs(meta.name, label, city).slice(0, 2);
  list[0][0] = `Is ${meta.name} a buyer&rsquo;s or seller&rsquo;s market right now?`;
  const crumbItems = [['Home', 'index.html'], ['Local Insight', 'local-insight.html'], [`${meta.name} Market`, file]];
  const newestFirst = [...editions].reverse();

  const body = `
    <header class="rp-header">
      <div class="rp-wrap">
        ${crumbHtml(crumbItems)}
        <p class="rp-eyebrow">Local Intelligence&trade; &middot; ${meta.name}</p>
        <h1 class="rp-h1">${meta.name} Real Estate Market <em>Prices, trends &amp; monthly reports</em></h1>
        <p class="rp-tagline">${meta.intro}</p>
      </div>
    </header>

    <div class="rp-wrap rp-body">

      <section class="rp-section" aria-labelledby="rp-latest-heading">
        <h2 class="rp-h2" id="rp-latest-heading">The latest: ${label}</h2>
        <p class="rp-lead">${city.tagline}</p>
        <div class="rp-snapshot">${scoreCard(city)}
          <div class="rp-snapshot__side">
            <p class="rp-label">At a glance</p>${signalList(city)}${statGrid(s)}
          </div>
        </div>
        <p><a class="rp-link" href="${reportFile(key, latest.month)}">Read the full ${meta.name} ${label} report <span aria-hidden="true">&rarr;</span></a></p>
      </section>

      <section class="rp-section" aria-labelledby="rp-trend-heading">
        <h2 class="rp-h2" id="rp-trend-heading">${meta.name} market trends</h2>
        <div class="rp-table-wrap">
          <table class="rp-table rp-table--trend">
            <caption>Detached homes unless noted. Year-over-year changes in brackets.</caption>
            <thead><tr><th scope="col">Month</th><th scope="col">Balance Index</th><th scope="col">Detached median</th><th scope="col">Sales</th><th scope="col">Days on market</th><th scope="col">Townhouse / condo median</th></tr></thead>
            <tbody>${newestFirst.map((ed) => {
              const t = keyStats(ed.cities[key]);
              return `
              <tr><th scope="row"><a href="${reportFile(key, ed.month)}">${monthLabel(ed.month)}</a></th><td>${ed.cities[key].score}/100</td><td>${t.median} <small>(${t.medianChg})</small></td><td>${t.sales} <small>(${t.salesChg})</small></td><td>${t.dom} <small>(${t.domChg})</small></td><td>${t.cMedian} <small>(${t.cMedianChg})</small></td></tr>`;
            }).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="rp-section" aria-labelledby="rp-archive-heading">
        <h2 class="rp-h2" id="rp-archive-heading">All ${meta.name} market reports</h2>
        <ul class="rp-archive">${newestFirst.map((ed) => `
          <li><a href="${reportFile(key, ed.month)}"><span class="rp-archive__month">${monthLabel(ed.month)}</span><span class="rp-archive__score">${ed.cities[key].score}/100 &middot; ${ed.cities[key].label}</span><span class="rp-archive__text">${ed.cities[key].summary}</span></a></li>`).join('')}
        </ul>
      </section>
${faqHtml(list)}
${cta(meta.name)}
    </div>`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${BASE}/${file}#webpage`,
        url: `${BASE}/${file}`,
        name: plain(title),
        description: plain(description),
        dateModified: latest.modified || latest.published,
        inLanguage: 'en-CA',
        publisher: team,
        about: { '@type': 'City', name: meta.name, containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario' } },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: newestFirst.map((ed, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE}/${reportFile(key, ed.month)}`, name: `${meta.name} Real Estate Market Report, ${monthLabel(ed.month)}` }))
        }
      },
      crumbs(crumbItems),
      faqLd(list)
    ]
  };
  return { file, html: page({ c, file, title, description, image: meta.image, imageAlt: meta.imageAlt, imageSize: meta.imageSize, jsonld, body }), published: latest.published };
}

/* ── main ────────────────────────────────────────────────────────────── */

const data = JSON.parse(await readFile(DATA_FILE, 'utf8').catch(() => '{"editions":[]}'));
const upsert = (ed) => {
  data.editions = data.editions.filter((e) => e.month !== ed.month).concat(ed).sort((a, b) => a.month.localeCompare(b.month));
};

const args = process.argv.slice(2);
const liPath = path.join(root, 'local-insight.html');
let li = await readFile(liPath, 'utf8');

if (args[0] === '--import') {
  const [, src, ym, published] = args;
  upsert({ ...extractEdition(await readFile(src, 'utf8'), ym), published });
  console.log(`Imported ${monthLabel(ym)} from ${src}`);
} else {
  const ym = currentMonth(li);
  const existing = data.editions.find((e) => e.month === ym);
  const fresh = extractEdition(li, ym);
  const today = new Date().toISOString().slice(0, 10);
  if (!existing) {
    upsert({ ...fresh, published: today });
    console.log(`Added ${monthLabel(ym)} from local-insight.html`);
  } else if (JSON.stringify(existing.cities) !== JSON.stringify(fresh.cities)) {
    upsert({ ...fresh, published: existing.published, modified: today });
    console.log(`Updated ${monthLabel(ym)} from local-insight.html`);
  }
}
await writeFile(DATA_FILE, JSON.stringify(data, null, 2) + '\n');

const c = chrome(li);
const pages = [];
for (const key of Object.keys(CITIES)) {
  const eds = data.editions.filter((e) => e.cities[key]);
  eds.forEach((ed, i) => pages.push(reportPage(c, key, ed, eds[i - 1], eds[i + 1])));
  pages.push(hubPage(c, key, eds));
}
for (const p of pages) await writeFile(path.join(root, p.file), p.html);

/* Report links inside local-insight.html (one block per city panel). */
for (const key of Object.keys(CITIES)) {
  const latest = data.editions[data.editions.length - 1];
  const re = new RegExp(`(<!-- REPORT-LINKS:${key} -->)[\\s\\S]*?(<!-- /REPORT-LINKS -->)`);
  const block = `$1
              <p class="li-report-links"><a href="${reportFile(key, latest.month)}" class="text-link text-link--dark text-link--arrow">Read the full ${CITIES[key].name} ${monthLabel(latest.month)} report <span aria-hidden="true">&rarr;</span></a> <a href="${hubFile(key)}" class="li-report-links__all">All ${CITIES[key].name} reports &amp; trends</a></p>
              $2`;
  if (re.test(li)) li = li.replace(re, block);
}
await writeFile(liPath, li);

/* Register pages for the sitemap + validator. */
const cfgPath = path.join(root, 'site.config.json');
const cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
for (const p of pages) {
  const key = Object.keys(CITIES).find((k) => p.file.startsWith(k));
  const entry = {
    file: p.file,
    path: `/${p.file}`,
    lastmod: p.published,
    images: [{ path: `/${CITIES[key].image}`, title: `${CITIES[key].name} real estate market`, caption: CITIES[key].imageAlt }]
  };
  const i = cfg.publicPages.findIndex((x) => x.file === p.file);
  if (i >= 0) cfg.publicPages[i] = { ...cfg.publicPages[i], ...entry };
  else cfg.publicPages.push(entry);
}
await writeFile(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

console.log(`Wrote ${pages.length} pages: ${pages.map((p) => p.file).join(', ')}`);
