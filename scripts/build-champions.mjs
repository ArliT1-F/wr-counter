// Generates data/champions.json (142-champion Wild Rift roster) from the
// community-maintained snapshot of official WR data (patch 7.3):
//   - TimLindeijer/wildrift-stats  (data/champions.json, base-stats.json, abilities.json)
//
// Fetch sources first:
//   node scripts/fetch-champion-sources.mjs
// Then run:
//   node scripts/build-champions.mjs
//
// Overlays below (damage type, CC/healing, ranges, rune/spell defaults) are
// hand-maintained classification data — see README "Data model notes".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'data', 'sources');

/* ------------------------------------------------------------------ */
/* Hand-maintained classification overlays                             */
/* ------------------------------------------------------------------ */

// Champions whose damage is mostly magic (abilities + magic-scaling patterns).
const AP = new Set(`ahri akali amumu annie aurelion-sol aurora bard brand chogath diana ekko evelynn fiddlesticks fizz
  galio gwen heimerdinger hwei janna jax karma kassadin kennen lillia lissandra lulu lux malphite maokai mel milio
  mordekaiser morgana nami norra nunu-willump orianna rumble ryze seraphine singed sona soraka swain syndra taliyah
  teemo veigar velkoz vex viktor vladimir yuumi ziggs zilean zoe zyra`.split(/\s+/).filter(Boolean));

// Mixed damage threats (both physical and magic in their core rotation).
const MIXED = new Set(`katarina kayle kogmaw yone zeri shen ornn sion skarner thresh twisted-fate kayn shyvana
  rengar volibear gragas ksante`.split(/\s+/).filter(Boolean));

// Champions with meaningful self/ally healing in their kit.
const HEALING = new Set(`aatrox ahri camille darius fiora garen gwen gragas irelia janna karma kayn kindred lee-sin
  lulu master-yi milio nami nasus nidalee nilah nunu-willump olaf rakan renekton rengar senna seraphine sett shen
  singed sona soraka swain tryndamere vladimir warwick xin-zhao yuumi aatrox pyke maokai`.split(/\s+/).filter(Boolean));

// No hard CC (stun/root/knockup/taunt/suppress/fear/pull) in their base kit.
const NO_CC = new Set(`akali corki ezreal fiora graves kaisa katarina khazix kindred kogmaw master-yi rumble sivir
  talon twitch vladimir tryndamere olaf zeri yasuo`.split(/\s+/).filter(Boolean));
// note: yasuo HAS tornado knockup -> remove from NO_CC below
NO_CC.delete('yasuo');

// Melee roster (attack range <= 200). Everyone else is ranged.
const MELEE = new Set(`aatrox akali ambessa blitzcrank braum camille chogath darius diana dr-mundo draven ekko
  evelynn fiora fizz galio garen gragas gwen hecarim irelia jarvan-iv jax kassadin katarina kayle kayn khazix ksante
  lee-sin leona lillia malphite maokai master-yi mordekaiser nautilus nasus nilah nocturne nunu-willump olaf ornn
  pantheon poppy pyke rakan rammus rell renekton rengar riven rumble sett shen shyvana singed sion skarner talon
  tryndamere viego vi volibear warwick wukong xin-zhao yasuo yone zed`.split(/\s+/).filter(Boolean));

// High-confidence attack ranges (defaults: 175 melee / 550 ranged).
const RANGE_OVERRIDE = {
  blitzcrank: 125, gragas: 125, rumble: 125, kassadin: 150, kayle: 175,
  annie: 625, caitlyn: 650, senna: 600, ashe: 600, teemo: 500, jinx: 525,
  tristana: 525, kindred: 500, kogmaw: 500, urgot: 425, thresh: 450,
  vladimir: 450, zilean: 500, bard: 500, gnar: 400, jayce: 500, nidalee: 525,
  samira: 500, nilah: 225, thresh: 450, vayne: 550, viego: 225,
};

// Colors for champions outside the original hand-picked 20 (thematic hues).
const COLOR_OVERRIDE = {
  akali: '#3D8B7A', akshan: '#C9A227', alistar: '#7A6B55', ambessa: '#8E4A2E', amumu: '#5C8A4E',
  annie: '#E2574C', ashe: '#7FB8D9', 'aurelion-sol': '#4B6FBF', aurora: '#B866D9', bard: '#C9A06B',
  blitzcrank: '#C2762E', brand: '#E2622E', braum: '#5C93C9', caitlyn: '#5B7FA8', "cho-gath": '#7B4EA8',
  corki: '#C9682E', diana: '#B8A6D9', 'dr-mundo': '#8E6CB8', draven: '#B8482E', ekko: '#48B8B8',
  evelynn: '#8E3E7B', fiddlesticks: '#6B7A3E', fiora: '#B8A8D9', fizz: '#48A8D9', galio: '#7A8B9B',
  gnar: '#C98848', gragas: '#8B6B3E', graves: '#7A5A3E', gwen: '#48B8A8', hecarim: '#4A7A6B',
  heimerdinger: '#C9A848', hwei: '#6B7FD9', irelia: '#5A9BD9', janna: '#8FC9D9', 'jarvan-iv': '#C9A048',
  jax: '#6B5B8B', jayce: '#48A0B8', jhin: '#8B3E5A', kalista: '#48C9A8', karma: '#C97F9B',
  kassadin: '#6B4E9B', kayle: '#C9C0A8', kayn: '#4A5A8B', kennen: '#C9B848', 'khazix': '#6B4E8B',
  kindred: '#8BB8C9', 'kogmaw': '#8B7B3E', leona: '#C9A848', lillia: '#C98BB8', lissandra: '#6BA8D9',
  lucian: '#A88B5A', lulu: '#8B6BB8', maokai: '#5A7A4A', 'master-yi': '#7A8BAA', milio: '#E2884E',
  mordekaiser: '#4A8B5A', morgana: '#6B3E7B', nasus: '#C2A048', nautilus: '#5A7A8B', nidalee: '#C98848',
  nilah: '#48A8B8', nocturne: '#4A3E6B', norra: '#C97FD9', 'nunu-willump': '#6BB8D9', olaf: '#8B6B48',
  orianna: '#A89BD9', ornn: '#B85A3E', pantheon: '#B86B48', poppy: '#5A9B8B', pyke: '#4A8B7B',
  rakan: '#D97F5A', rammus: '#8B8B48', rell: '#7A6B7B', renekton: '#6B8B48', rengar: '#C2A048',
  riven: '#5A9B7B', rumble: '#C96B2E', ryze: '#486BB8', samira: '#C95748', senna: '#5A8B6B',
  shen: '#5A6B8B', shyvana: '#B8483E', singed: '#6B7B48', sion: '#6B5A48', sivir: '#C9A868',
  skarner: '#5A7BC9', smolder: '#D97B48', sona: '#6B9BD9', soraka: '#8B6BC9', swain: '#8B3E48',
  syndra: '#7B4EA8', taliyah: '#C98848', talon: '#6B3E48', teemo: '#6B9B48', tristana: '#C97B5A',
  tryndamere: '#8B4A3E', 'twisted-fate': '#486BC9', twitch: '#6B8B3E', urgot: '#6B7B5A', varus: '#7B4E8B',
  vayne: '#4A4A6B', veigar: '#5A4E9B', vex: '#7B5AA8', vi: '#E0567A', vladimir: '#A83E4E',
  volibear: '#5A7BA8', wukong: '#C28848', xayah: '#B85A7B', 'xin-zhao': '#5A7B8B', yone: '#4A6B8B',
  yuumi: '#9B6BD9', zeri: '#48C9B8', ziggs: '#E2913E', zilean: '#A89B68', zoe: '#D99BD9', zyra: '#8B4E5A',
  chogath: '#6B3E8B', ksante: '#4E9E8B', mel: '#A87BC9', velkoz: '#8B4EC9', viego: '#3EB88B',
  viktor: '#B8723E', warwick: '#5E7B6B', yunara: '#D97BA8',
};

// Archetype defaults: [runes...], [spells...], core-spike item
const ARCHETYPES = {
  fighter: { runes: ['conqueror', 'brutal', 'legend-tenacity', 'last-stand', 'second-wind'], spells: ['flash', 'ignite'], item: 'black-cleaver' },
  juggernaut: { runes: ['conqueror', 'brutal', 'legend-tenacity', 'last-stand', 'second-wind'], spells: ['flash', 'ghost'], item: 'trinity-force' },
  mage: { runes: ['arcane-comet', 'scorch', 'mark-of-the-weak', 'eyeball-collector', 'manaflow-band'], spells: ['flash', 'ignite'], item: 'rabadons-deathcap' },
  burst: { runes: ['electrocute', 'sudden-impact', 'mark-of-the-weak', 'eyeball-collector', 'manaflow-band'], spells: ['flash', 'ignite'], item: 'ludens-echo' },
  assassin: { runes: ['electrocute', 'sudden-impact', 'mark-of-the-weak', 'eyeball-collector', 'nimbus-cloak'], spells: ['flash', 'ignite'], item: 'youmuus-ghostblade' },
  marksman: { runes: ['lethal-tempo', 'brutal', 'legend-alacrity', 'coup-de-grace', 'second-wind'], spells: ['flash', 'heal'], item: 'infinity-edge' },
  tank: { runes: ['aftershock', 'font-of-life', 'bone-plating', 'overgrowth', 'triumph'], spells: ['flash', 'ignite'], item: 'sunfire-aegis' },
  support: { runes: ['aery', 'font-of-life', 'loyalty', 'revitalize', 'manaflow-band'], spells: ['flash', 'exhaust'], item: 'harmonic-echo' },
  catcher: { runes: ['aftershock', 'font-of-life', 'bone-plating', 'overgrowth', 'pathfinder'], spells: ['flash', 'ignite'], item: 'protectors-vow' },
  skirmisher: { runes: ['conqueror', 'brutal', 'legend-alacrity', 'last-stand', 'second-wind'], spells: ['flash', 'ignite'], item: 'blade-of-the-ruined-king' },
};

function archetypeFor(roles, id) {
  const r = (roles || []).map((x) => String(x).toLowerCase());
  if (r.includes('marksman')) return 'marksman';
  if (r.includes('assassin')) return 'assassin';
  if (r.includes('mage')) return r.includes('support') ? 'support' : 'mage';
  if (r.includes('tank') || r.includes('warden') || r.includes('vanguard')) return r.includes('support') ? 'catcher' : 'tank';
  if (r.includes('support') || r.includes('enchanter')) return 'support';
  if (r.includes('skirmisher') || r.includes('diver')) return 'skirmisher';
  if (r.includes('juggernaut')) return 'juggernaut';
  if (r.includes('fighter')) return 'fighter';
  return 'fighter';
}

function colorFor(id) {
  if (COLOR_OVERRIDE[id]) return COLOR_OVERRIDE[id];
  // deterministic pleasant hue from name hash
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h}, 42%, 52%)`;
}

function firstLine(description) {
  const text = Array.isArray(description) ? description.join(' ') : String(description ?? '');
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 170 ? `${clean.slice(0, 167).replace(/\s+\S*$/, '')}…` : clean;
}

/** Official feed occasionally SHOUTS ability names ("DENTING BLOWS"). */
function titleCase(name) {
  return /^[A-Z0-9 '!&.\-]+$/.test(name)
    ? name.toLowerCase().replace(/(^|[\s'\-])([a-z])/g, (_, p, c) => p + c.toUpperCase())
    : name;
}

/* ------------------------------------------------------------------ */
/* Load sources + existing hand-written champion data                  */
/* ------------------------------------------------------------------ */
const roster = JSON.parse(fs.readFileSync(path.join(SRC, 'champions.json'), 'utf8')).champions;
const baseStats = JSON.parse(fs.readFileSync(path.join(SRC, 'base-stats.json'), 'utf8')).champions;
const abilities = JSON.parse(fs.readFileSync(path.join(SRC, 'abilities.json'), 'utf8')).champions;
const existing = JSON.parse(fs.readFileSync(path.join(root, 'data', 'champions.json'), 'utf8'));
const existingById = new Map(existing.map((c) => [c.id, c]));

const statsById = new Map(baseStats.map((c) => [c.heroId, c]));
const abilitiesById = new Map(abilities.map((c) => [c.heroId, c]));

const LANE_MAP = { baron: 'top', jungle: 'jungle', mid: 'mid', duo: 'bot', support: 'support' };

const SLOT_MAP = { passive: 'passive', 1: 'q', 2: 'w', 3: 'e', 4: 'r', ultimate: 'r' };

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */
const output = [];
for (const champ of roster) {
  const id = champ.slug;
  const stats = statsById.get(champ.heroId);
  const ab = abilitiesById.get(champ.heroId);
  const prev = existingById.get(id);
  if (!stats || !ab) throw new Error(`Missing source data for ${id}`);

  const lanes = (champ.lanes || []).map((l) => LANE_MAP[l]).filter(Boolean);
  const commonLanes = lanes.length ? [...new Set(lanes)] : ['mid'];

  // Abilities: prefer the official dataset; keep hand-written detail for the
  // original 20 only when the official row is missing (it never is).
  const abilitiesOut = {};
  for (const a of ab.abilities) {
    const slot = SLOT_MAP[a.slot];
    if (!slot) continue;
    abilitiesOut[slot] = {
      name: titleCase(a.name),
      description: firstLine(a.description),
      ...(Array.isArray(a.cooldown) && a.cooldown.length ? { cooldown: a.cooldown } : {}),
    };
  }
  for (const slot of ['passive', 'q', 'w', 'e', 'r']) {
    if (!abilitiesOut[slot] && prev?.abilities?.[slot]) abilitiesOut[slot] = prev.abilities[slot];
    if (!abilitiesOut[slot]) abilitiesOut[slot] = { name: slot.toUpperCase(), description: '' };
  }

  const isMelee = MELEE.has(id);
  const range = RANGE_OVERRIDE[id] ?? (isMelee ? 175 : 550);
  const arch = archetypeFor(champ.roles, id);
  // precedence: curated map > original hand-picked hex > generated hash
  const prevColor = prev?.color && !prev.color.startsWith('hsl') ? prev.color : undefined;
  const color = COLOR_OVERRIDE[id] ?? prevColor ?? colorFor(id);

  const entry = {
    id,
    name: champ.name,
    title: champ.title,
    commonLanes,
    damageType: AP.has(id) ? 'ap' : MIXED.has(id) ? 'mixed' : 'ad',
    color,
    icon: `${id}.png`,
    hasHealing: HEALING.has(id),
    hasCC: !NO_CC.has(id),
    defaultRunes: prev?.defaultRunes ?? ARCHETYPES[arch].runes,
    defaultSpells: prev?.defaultSpells ?? (id === 'lee-sin' || id === 'vi' || id === 'jarvan-iv' || id === 'wukong' || id === 'nocturne' || id === 'kha-zix' || id === 'rengar' || id === 'shyvana' || id === 'hecarim' || id === 'nunu-willump' || id === 'amumu' || id === 'rammus' || id === 'skarner' || id === 'mundo' ? ['flash', 'smite'] : ARCHETYPES[arch].spells),
    abilities: abilitiesOut,
    powerSpikes: prev?.powerSpikes ?? ['level2', 'level5', ARCHETYPES[arch].item],
    stats: {
      hp: stats.hp[0],
      hpPerLevel: stats.hp[1],
      hpRegen: stats.hpRegen[0],
      hpRegenPerLevel: stats.hpRegen[1],
      mana: stats.mana?.[0] ?? 0,
      manaPerLevel: stats.mana?.[1] ?? 0,
      manaRegen: stats.manaRegen?.[0] ?? 0,
      manaRegenPerLevel: stats.manaRegen?.[1] ?? 0,
      attackDamage: stats.ad[0],
      attackDamagePerLevel: stats.ad[1],
      armor: stats.armor[0],
      armorPerLevel: stats.armor[1],
      magicResist: stats.mr[0],
      magicResistPerLevel: stats.mr[1],
      moveSpeed: stats.ms,
      attackRange: range,
      rangeType: isMelee ? 'melee' : 'ranged',
    },
  };
  output.push(entry);
}

// keep deterministic order: the 20 hand-written first (stable UX), rest A→Z
const FIRST = ['ahri', 'darius', 'garen', 'jinx', 'lee-sin', 'lux', 'malphite', 'miss-fortune', 'nami', 'seraphine',
  'sett', 'thresh', 'vi', 'yasuo', 'zed', 'kaisa', 'camille', 'aatrox', 'katarina', 'ezreal'];
output.sort((a, b) => {
  const ia = FIRST.indexOf(a.id);
  const ib = FIRST.indexOf(b.id);
  if (ia >= 0 || ib >= 0) return (ia >= 0 ? ia : 999) - (ib >= 0 ? ib : 999);
  return a.name.localeCompare(b.name);
});

fs.writeFileSync(path.join(root, 'data', 'champions.json'), JSON.stringify(output, null, 2));
console.log(`Wrote data/champions.json — ${output.length} champions`);
const missingColor = output.filter((c) => c.color.startsWith('hsl')).length;
console.log(`hash colors: ${missingColor}, ranged: ${output.filter((c) => c.stats.rangeType === 'ranged').length}, melee: ${output.filter((c) => c.stats.rangeType === 'melee').length}`);
