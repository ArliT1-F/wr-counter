// Generates placeholder app icons + favicon (colored shapes + bitmap text).
// Real Riot assets can replace these later — the app's <GameIcon> fallback also
// covers missing champion/item icons at runtime.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, encodePNG, fillRect, fillRoundedRect, fillCircle, drawText } from './draw.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const BG = '#0A1628';
const GOLD = '#C89B3C';
const TEAL = '#0AC8B9';
const TEXT = '#F0E6D2';

function appIcon(size, { maskable = false } = {}) {
  const c = createCanvas(size, size);
  const pad = maskable ? 0 : 0;
  fillRect(c, 0, 0, size, size, BG);
  // soft elevated panel
  fillRoundedRect(c, size * 0.12, size * 0.12, size * 0.76, size * 0.76, size * 0.18, '#1A2332');
  // teal slash accent
  fillRoundedRect(c, size * 0.2, size * 0.7, size * 0.6, size * 0.06, size * 0.03, TEAL);
  // gold ring
  fillCircle(c, size / 2, size * 0.44, size * 0.27, GOLD);
  fillCircle(c, size / 2, size * 0.44, size * 0.235, BG);
  const s = Math.max(2, Math.round(size / 36));
  drawText(c, size / 2, size * 0.44 - 3.5 * s, 'WR', TEXT, s, 'center');
  return encodePNG(c);
}

fs.writeFileSync(path.join(outDir, 'app-icon-192.png'), appIcon(192));
fs.writeFileSync(path.join(outDir, 'app-icon-512.png'), appIcon(512));
fs.writeFileSync(path.join(outDir, 'app-icon-maskable-512.png'), appIcon(512, { maskable: true }));

// SVG favicon (lightweight, scales anywhere)
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0A1628"/>
  <circle cx="32" cy="32" r="18" fill="#C89B3C"/>
  <circle cx="32" cy="32" r="14.5" fill="#0A1628"/>
  <text x="32" y="38" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#F0E6D2" text-anchor="middle">WR</text>
</svg>
`;
fs.writeFileSync(path.join(root, 'public', 'favicon.svg'), favicon);

console.log('Generated app icons + favicon in public/icons');
