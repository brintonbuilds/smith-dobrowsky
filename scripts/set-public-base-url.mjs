import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'site.config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const currentBaseUrl = config.publicBaseUrl.replace(/\/$/, '');
const requestedBaseUrl = (process.argv[2] || '').replace(/\/$/, '');

if (!/^https:\/\/[^/]+(?:\/[^?#]*)?$/.test(requestedBaseUrl)) {
  throw new Error('Usage: node scripts/set-public-base-url.mjs https://example.com');
}

const files = [
  ...config.publicPages.map((page) => page.file),
  'robots.txt',
  'sitemap.xml'
];

for (const file of files) {
  const filePath = path.join(root, file);
  const source = await readFile(filePath, 'utf8');
  await writeFile(filePath, source.replaceAll(currentBaseUrl, requestedBaseUrl));
}

config.publicBaseUrl = requestedBaseUrl;
config.domainStatus = 'production-domain-confirmed';
config.finalProductionDomainConfirmed = true;
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Updated the public base URL from ${currentBaseUrl} to ${requestedBaseUrl}`);
