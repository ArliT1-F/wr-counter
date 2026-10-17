// Maps champion/item icon PNGs from the asset mirror into public/icons/.
//
//   git clone --depth 1 --filter=blob:none --sparse \
//     https://github.com/TheePepS/League_Of_Legends_Assets /tmp/wr-assets
//   cd /tmp/wr-assets && git sparse-checkout set \
//     Champions_assets Items_assets Summoners_Spells_Assets Champions_Spells_Assets
//   node scripts/sync-icons.mjs --from /tmp/wr-assets
//
// Matching: filenames are normalized to lowercase alphanumerics only and
// matched against champion / item / spell / ability names
// (Miss_Fortune.png → missfortune ← miss-fortune; Ahri_Charm.png → ahricharm
// ← "Ahri" + "Charm"). Entries without a match keep the in-app fallback
// glyphs (see GameIcon) — e.g. Wild Rift-exclusive items/abilities.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const fromIdx = argv.indexOf('--from');
const from = fromIdx >= 0 ? argv[fromIdx + 1] : '/tmp/wr-assets';

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function indexPngs(dir) {
  const map = new Map();
  if (!fs.existsSync(dir)) return map;
  for (const f of fs.readdirSync(dir)) {
    if (!f.toLowerCase().endsWith('.png')) continue;
    const key = norm(path.basename(f, path.extname(f)));
    if (!map.has(key)) map.set(key, path.join(dir, f));
  }
  return map;
}

function isPng(file) {
  const head = fs.readFileSync(file).subarray(0, 8);
  return head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
}

function copy(label, file, target) {
  fs.copyFileSync(file, target);
  if (!isPng(target)) throw new Error(`not a PNG: ${file}`);
}

function syncSet(label, srcDir, destDir, entries) {
  // entries: [{ key: string[], target: string, id: string }]
  const index = indexPngs(srcDir);
  fs.mkdirSync(destDir, { recursive: true });
  let ok = 0;
  const missing = [];
  for (const entry of entries) {
    const file = entry.key.map(index.get.bind(index)).find(Boolean);
    const target = path.join(destDir, entry.target);
    if (file) {
      copy(label, file, target);
      ok++;
    } else {
      missing.push(entry.id);
    }
  }
  console.log(`${label}: ${ok}/${entries.length} synced → ${destDir}`);
  if (missing.length) console.log(`  (fallback glyphs for: ${missing.join(', ')})`);
  return missing;
}

const champions = JSON.parse(fs.readFileSync(path.join(root, 'data', 'champions.json'), 'utf8'));
const items = JSON.parse(fs.readFileSync(path.join(root, 'data', 'items.json'), 'utf8'));
const spells = JSON.parse(fs.readFileSync(path.join(root, 'data', 'spells.json'), 'utf8'));

// Ability-name aliases where Wild Rift renamed a PC ability (asset files keep
// the PC name). key = `${championId}:${slot}` → the PC ability name to use.
const ABILITY_ALIASES = {
  'fizz:w': ['Seastone Trident'], // WR: "Rending Wave"
  'gwen:passive': ['A Thousand Cuts'], // WR: "Thousand Cuts"
  'karma:r': ['Mantra'], // WR: "Transcendent Embrace"
  'rammus:passive': ['Spiked Shell'], // WR: "Rolling Armordillo"
  'teemo:e': ['Guerrilla Warfare'], // WR: "Guerilla Warfare" (stealth, one-r spelling)
  'vi:r': ['Assault and Battery'], // WR: "Cease and Desist"
  'wukong:passive': ['Stone Skin'], // WR: "Crushing Blows"
  'wukong:q': ['Crushing Blow'], // WR: "Golden Staff"
  'zilean:w': ['Rewind'], // WR: "Twisted Timeflow"
  'zilean:e': ['Time Warp'], // WR: "Temporal Mirage"
};

const missC = syncSet('champions', path.join(from, 'Champions_assets'), path.join(root, 'public/icons/champions'),
  champions.map((c) => ({ key: [norm(c.id), norm(c.name)], target: c.icon, id: c.id })));

const missI = syncSet('items', path.join(from, 'Items_assets'), path.join(root, 'public/icons/items'),
  items.map((i) => ({ key: [norm(i.id), norm(i.name)], target: i.icon ?? `${i.id}.png`, id: i.id })));

const missS = syncSet('spells', path.join(from, 'Summoners_Spells_Assets'), path.join(root, 'public/icons/spells'),
  spells.map((s) => ({ key: [norm(s.id), norm(s.name)], target: s.icon ?? `${s.id}.png`, id: s.id })));

const abilityEntries = [];
for (const champ of champions) {
  for (const slot of ['passive', 'q', 'w', 'e', 'r']) {
    const ability = champ.abilities[slot];
    if (!ability) continue;
    const aliases = ABILITY_ALIASES[`${champ.id}:${slot}`] ?? [];
    abilityEntries.push({
      key: [
        norm(`${champ.name} ${ability.name}`),
        ...aliases.map((a) => norm(`${champ.name} ${a}`)),
      ],
      target: `${champ.id}-${slot}.png`,
      id: `${champ.id}:${slot}`,
    });
  }
}
const missA = syncSet('abilities', path.join(from, 'Champions_Spells_Assets'), path.join(root, 'public/icons/abilities'),
  abilityEntries);

console.log(`Done. Missing — champions: ${missC.length}, items: ${missI.length}, spells: ${missS.length}, abilities: ${missA.length}`);
