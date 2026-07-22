import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const baseUrl = config.publicBaseUrl.replace(/\/$/, '');

const urlEntries = config.publicPages.map((page) => [
  '  <url>',
  `    <loc>${baseUrl}${page.path}</loc>`,
  `    <lastmod>${page.lastmod}</lastmod>`,
  '  </url>'
].join('\n'));

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urlEntries,
  '</urlset>',
  ''
].join('\n');

const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${baseUrl}/sitemap.xml`,
  ''
].join('\n');

await Promise.all([
  writeFile(path.join(root, 'sitemap.xml'), sitemap),
  writeFile(path.join(root, 'robots.txt'), robots)
]);

console.log(`Generated sitemap.xml and robots.txt for ${baseUrl}`);
