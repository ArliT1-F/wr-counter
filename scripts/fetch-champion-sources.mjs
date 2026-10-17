// Downloads the Wild Rift champion data sources (patch snapshot) used by
// build-champions.mjs into data/sources/ (gitignored — ~600 KB).
//
// Source: https://github.com/TimLindeijer/wildrift-stats (community mirror of
// official Wild Rift website + China-server data, updated daily).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'data', 'sources');
const tmp = fs.mkdtempSync('/tmp/wr-sources-');

console.log('Downloading TimLindeijer/wildrift-stats (main branch)…');
execSync(
  `curl -sL "https://codeload.github.com/TimLindeijer/wildrift-stats/tar.gz/refs/heads/main" -o ${tmp}/src.tgz`,
  { stdio: 'inherit' },
);
execSync(`tar xzf ${tmp}/src.tgz -C ${tmp}`, { stdio: 'inherit' });

fs.mkdirSync(out, { recursive: true });
for (const f of ['champions.json', 'base-stats.json', 'abilities.json']) {
  const found = execSync(`find ${tmp} -name '${f}' -path '*/data/*' | head -1`).toString().trim();
  if (!found) throw new Error(`source file not found: ${f}`);
  fs.copyFileSync(found, path.join(out, f));
  console.log('→', path.join(out, f));
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log('Done. Now run: node scripts/build-champions.mjs');
