import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const baseUrl = config.publicBaseUrl.replace(/\/$/, '');
const errors = [];
const titles = new Map();
const descriptions = new Map();

function matches(source, pattern) {
  return [...source.matchAll(pattern)];
}

function valueFromTag(tag, attribute) {
  return (tag.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, 'i')) || [])[1];
}

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

for (const page of config.publicPages) {
  const source = await readFile(path.join(root, page.file), 'utf8');
  const titleMatches = matches(source, /<title>([\s\S]*?)<\/title>/gi);
  const descriptionMatches = matches(source, /<meta\s+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/gi);
  const canonicalMatches = matches(source, /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi);
  const h1Matches = matches(source, /<h1\b/gi);
  const mainMatches = matches(source, /<main\b/gi);
  const jsonLdMatches = matches(source, /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
  const expectedCanonical = `${baseUrl}${page.path}`;

  if (titleMatches.length !== 1) errors.push(`${page.file}: expected one title, found ${titleMatches.length}`);
  if (descriptionMatches.length !== 1) errors.push(`${page.file}: expected one meta description, found ${descriptionMatches.length}`);
  if (canonicalMatches.length !== 1 || canonicalMatches[0]?.[1] !== expectedCanonical) {
    errors.push(`${page.file}: canonical must be ${expectedCanonical}`);
  }
  if (h1Matches.length !== 1) errors.push(`${page.file}: expected one H1, found ${h1Matches.length}`);
  if (mainMatches.length !== 1) errors.push(`${page.file}: expected one main landmark, found ${mainMatches.length}`);
  if (!/<nav\b[^>]*aria-label=["']Main navigation["']/i.test(source)) errors.push(`${page.file}: source navigation is missing`);
  if (!/<meta\s+name=["']robots["'][^>]*index,follow/i.test(source)) errors.push(`${page.file}: indexable robots directive is missing`);
  if (!/<meta\s+property=["']og:url["'][^>]*content=["'][^"']+["']/i.test(source)) errors.push(`${page.file}: og:url is missing`);
  if (!/<meta\s+name=["']twitter:card["']/i.test(source)) errors.push(`${page.file}: Twitter card metadata is missing`);
  if (jsonLdMatches.length === 0) errors.push(`${page.file}: JSON-LD is missing`);

  const title = titleMatches[0]?.[1]?.trim();
  const description = descriptionMatches[0]?.[1]?.trim();
  if (title) {
    if (titles.has(title)) errors.push(`${page.file}: duplicate title also used by ${titles.get(title)}`);
    titles.set(title, page.file);
  }
  if (description) {
    if (descriptions.has(description)) errors.push(`${page.file}: duplicate description also used by ${descriptions.get(description)}`);
    descriptions.set(description, page.file);
  }

  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@context'] !== 'https://schema.org') errors.push(`${page.file}: JSON-LD context is not Schema.org`);
    } catch (error) {
      errors.push(`${page.file}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const imageMatch of matches(source, /<img\b[\s\S]*?>/gi)) {
    const tag = imageMatch[0];
    const src = valueFromTag(tag, 'src');
    if (!src) {
      errors.push(`${page.file}: image has no src`);
      continue;
    }
    if (!/\balt=["'][^"']*["']/i.test(tag)) errors.push(`${page.file}: ${src} has no alt attribute`);
    if (!/\bwidth=["']\d+["']/i.test(tag) || !/\bheight=["']\d+["']/i.test(tag)) {
      errors.push(`${page.file}: ${src} needs numeric width and height`);
    }
    if (!/^https?:|^data:/.test(src) && !(await exists(src.split(/[?#]/)[0]))) errors.push(`${page.file}: missing image ${src}`);
  }

  const ids = new Set(matches(source, /\bid=["']([^"']+)["']/gi).map((match) => match[1]));
  for (const linkMatch of matches(source, /<a\b[\s\S]*?href=["']([^"']*)["'][\s\S]*?>/gi)) {
    const href = linkMatch[1];
    if (!href || href === '#') {
      errors.push(`${page.file}: empty or placeholder link found`);
      continue;
    }
    if (/^(?:https?:|mailto:|tel:)/i.test(href)) continue;
    if (href.startsWith('#')) {
      if (!ids.has(href.slice(1))) errors.push(`${page.file}: missing anchor target ${href}`);
      continue;
    }
    const [targetPath, fragment] = href.split('#');
    const cleanTarget = targetPath.split('?')[0] || page.file;
    if (!(await exists(cleanTarget))) {
      errors.push(`${page.file}: missing internal target ${cleanTarget}`);
      continue;
    }
    if (fragment && cleanTarget.endsWith('.html')) {
      const targetSource = await readFile(path.join(root, cleanTarget), 'utf8');
      if (!new RegExp(`\\bid=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(targetSource)) {
        errors.push(`${page.file}: ${href} points to a missing fragment`);
      }
    }
  }
}

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = matches(sitemap, /<loc>([^<]+)<\/loc>/g).map((match) => match[1]);
const expectedSitemapUrls = config.publicPages.map((page) => `${baseUrl}${page.path}`);
if (JSON.stringify(sitemapUrls) !== JSON.stringify(expectedSitemapUrls)) errors.push('sitemap.xml URLs do not match canonical public pages');

const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${baseUrl}/sitemap.xml`)) errors.push('robots.txt sitemap URL is inconsistent');

for (const errorPage of config.errorPages || []) {
  const source = await readFile(path.join(root, errorPage), 'utf8');
  if (!/<meta\s+name=["']robots["'][^>]*noindex,follow/i.test(source)) errors.push(`${errorPage}: noindex,follow is missing`);
  if (matches(source, /<h1\b/gi).length !== 1) errors.push(`${errorPage}: expected one H1`);
  if (/<link\s+rel=["']canonical["']/i.test(source)) errors.push(`${errorPage}: error pages must not self-canonicalize`);
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${config.publicPages.length} public pages: metadata, H1s, schema, links, anchors, images, sitemap, and robots.`);
}
