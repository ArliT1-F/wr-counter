// Post-build: generates SEO pages for the top matchups + OG images + sitemap.
// - dist/counter/{slug}/index.html  (meta-injected app shell — direct URL serves real tags)
// - dist/og/{slug}.png              (champion A vs B fallback-style OG cards)
// - dist/sitemap.xml, dist/404.html (GitHub Pages SPA fallback)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, encodePNG, fillRect, fillCircle, drawText } from './draw.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://wr-counter.vercel.app').replace(/\/$/, '');
const PATCH_VERSION = '7.3';

const champions = JSON.parse(fs.readFileSync(path.join(root, 'data/champions.json'), 'utf8'));
const matchups = JSON.parse(fs.readFileSync(path.join(root, 'data/matchups.json'), 'utf8'));
const byId = Object.fromEntries(champions.map((c) => [c.id, c]));

/* ---------------------------------------------------------------- */
/* Build the top-100 matchup slug list: 50 curated + best extra pairs */
/* ---------------------------------------------------------------- */
const slugs = matchups.map((m) => `${m.playerChampion}-vs-${m.enemyChampion}-${m.role}`);
const seen = new Set(slugs);
outer: for (const a of champions) {
  for (const b of champions) {
    if (a.id === b.id) continue;
    const role = a.commonLanes.find((lane) => b.commonLanes.includes(lane));
    if (!role) continue;
    const slug = `${a.id}-vs-${b.id}-${role}`;
    if (seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length >= 100) break outer;
  }
}

function parseSlug(slug) {
  const lastDash = slug.lastIndexOf('-');
  const role = slug.slice(lastDash + 1);
  const pair = slug.slice(0, lastDash);
  const vs = pair.indexOf('-vs-');
  return { playerId: pair.slice(0, vs), enemyId: pair.slice(vs + 4), role };
}

/* ---------------------------------------------------------------- */
/* OG image: dark card, two colored champion circles + initials      */
/* ---------------------------------------------------------------- */
function ogImage(player, enemy, role) {
  const W = 1200;
  const H = 630;
  const c = createCanvas(W, H);
  fillRect(c, 0, 0, W, H, '#0A1628');
  fillRect(c, 0, H - 90, W, 90, '#1A2332');
  fillCircle(c, 380, 270, 130, player.color);
  fillCircle(c, 380, 270, 112, '#0A1628');
  fillCircle(c, 820, 270, 130, enemy.color);
  fillCircle(c, 820, 270, 112, '#0A1628');
  drawText(c, 380, 270 - 45, player.name[0], '#F0E6D2', 13, 'center');
  drawText(c, 820, 270 - 45, enemy.name[0], '#F0E6D2', 13, 'center');
  drawText(c, 600, 270 - 28, 'VS', '#C89B3C', 8, 'center');
  drawText(c, 600, 70, 'WR COUNTER', '#C89B3C', 6, 'center');
  drawText(c, 600, 470, `${player.name} vs ${enemy.name}`, '#F0E6D2', 5, 'center');
  drawText(c, 600, 520, `${role.toUpperCase()} - WILD RIFT PATCH ${PATCH_VERSION}`, '#A09B8C', 3, 'center');
  return encodePNG(c);
}

/* ---------------------------------------------------------------- */
/* Meta-injected prerendered HTML per matchup                        */
/* ---------------------------------------------------------------- */
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const curatedById = Object.fromEntries(
  matchups.map((m) => [`${m.playerChampion}-vs-${m.enemyChampion}-${m.role}`, m]),
);

function metaFor(slug) {
  const { playerId, enemyId, role } = parseSlug(slug);
  const player = byId[playerId];
  const enemy = byId[enemyId];
  if (!player || !enemy) return null;
  const curated = curatedById[slug];
  const summary =
    curated?.summary ??
    `${player.name} vs ${enemy.name} in Wild Rift ${role}: counter their damage type, punish their cooldowns and manage the wave.`;
  const title = `${player.name} vs ${enemy.name} Counter Guide — Wild Rift Patch ${curated?.patchVersion ?? PATCH_VERSION} | WR Counter`;
  const description = `How to counter ${enemy.name} as ${player.name} in Wild Rift. ${summary}`;
  return { title, description, slug };
}

const ogDir = path.join(dist, 'og');
fs.mkdirSync(ogDir, { recursive: true });
const counterDir = path.join(dist, 'counter');
fs.mkdirSync(counterDir, { recursive: true });

const written = [];
for (const slug of slugs) {
  const meta = metaFor(slug);
  if (!meta) continue;
  const { playerId, enemyId, role } = parseSlug(slug);

  // OG image
  fs.writeFileSync(path.join(ogDir, `${slug}.png`), ogImage(byId[playerId], byId[enemyId], role));

  // Prerendered HTML with real tags (the SPA hydrates on top of it)
  const headInject = [
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${SITE_URL}/counter/${slug}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${SITE_URL}/counter/${slug}" />`,
    `<meta property="og:image" content="${SITE_URL}/og/${slug}.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');

  // Strip the shell's generic title/description/OG tags, then inject matchup-specific ones.
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/<meta\s+property="og:[\s\S]*?\/>/g, '')
    .replace(/<meta\s+name="twitter:[\s\S]*?\/>/g, '');
  html = html.replace('</head>', `    ${headInject}\n  </head>`);
  const pageDir = path.join(counterDir, slug);
  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(path.join(pageDir, 'index.html'), html);
  written.push(slug);
}

/* ---------------------------------------------------------------- */
/* Sitemap + GitHub Pages SPA fallback                               */
/* ---------------------------------------------------------------- */
const urls = [
  `${SITE_URL}/`,
  ...written.map((slug) => `${SITE_URL}/counter/${slug}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));

console.log(`Prerendered ${written.length} matchup pages, ${written.length} OG images, sitemap.xml, 404.html`);
