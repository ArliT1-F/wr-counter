import championsData from '../../data/champions.json';
import itemsData from '../../data/items.json';
import runesData from '../../data/runes.json';
import spellsData from '../../data/spells.json';
import matchupsData from '../../data/matchups.json';
import type { Champion, Item, Matchup, Role, Rune, Spell, CounterGuide } from './types';

/** Loads and indexes the static JSON data bundled at build time. */

function assertArray(name: string, data: unknown): unknown[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Data error: ${name} is missing or corrupted`);
  }
  return data;
}

function indexById<T extends { id: string }>(name: string, rows: unknown[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    const entry = row as T;
    if (!entry || typeof entry.id !== 'string') {
      throw new Error(`Data error: ${name} contains an invalid entry`);
    }
    map.set(entry.id, entry);
  }
  return map;
}

let cached: {
  champions: Champion[];
  championById: Map<string, Champion>;
  items: Item[];
  itemById: Map<string, Item>;
  runeById: Map<string, Rune>;
  spellById: Map<string, Spell>;
  matchups: Matchup[];
  matchupById: Map<string, Matchup>;
} | null = null;

/** Throws on corrupt data — the app shows the "Data error" screen with a cache reset. */
export function loadData(): NonNullable<typeof cached> {
  if (cached) return cached;
  const champions = assertArray('champions.json', championsData) as Champion[];
  const items = assertArray('items.json', itemsData) as Item[];
  const runes = assertArray('runes.json', runesData) as Rune[];
  const spells = assertArray('spells.json', spellsData) as Spell[];
  const matchups = assertArray('matchups.json', matchupsData) as Matchup[];

  for (const m of matchups) {
    if (!m.id || !m.playerChampion || !m.enemyChampion || !m.role) {
      throw new Error('Data error: matchups.json contains an invalid entry');
    }
  }

  cached = {
    champions,
    championById: indexById('champions.json', champions),
    items,
    itemById: indexById('items.json', items),
    runeById: indexById('runes.json', runes),
    spellById: indexById('spells.json', spells),
    matchups,
    matchupById: indexById('matchups.json', matchups.map((m) => ({ ...m, id: matchupIdFor(m.playerChampion, m.enemyChampion, m.role) }))),
  };
  return cached;
}

export function getChampions(): Champion[] {
  return loadData().champions;
}

export function getChampion(id: string): Champion | undefined {
  return loadData().championById.get(id);
}

export function getItem(id: string): Item | undefined {
  return loadData().itemById.get(id);
}

export function getItems(): Item[] {
  return loadData().items;
}

export function getSpells(): Spell[] {
  return [...loadData().spellById.values()];
}

/** "Barrier" → the summoner spell, for ability-window labels that name one. */
export function resolveSpellLabel(label: string): Spell | undefined {
  const key = abilityKey(label);
  return key ? getSpells().find((s) => abilityKey(s.name) === key) : undefined;
}

export function getMatchups(): Matchup[] {
  return loadData().matchups;
}

/* ---------------- Ability label → slot / icon resolution ---------------- */

export type AbilitySlot = 'passive' | 'q' | 'w' | 'e' | 'r';

const ABILITY_SLOTS: AbilitySlot[] = ['passive', 'q', 'w', 'e', 'r'];

const abilityKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** "Charm (E)" → 'e'; "Sonic Wave (Q, W)" → 'q'; tolerates trailing words. */
export function abilitySlotFromLabel(label: string): AbilitySlot | null {
  const m = /\(([QWERP])(?:\s*[,/]\s*[QWERP])?\)/.exec(label);
  if (!m) return null;
  const map: Record<string, AbilitySlot> = { Q: 'q', W: 'w', E: 'e', R: 'r', P: 'passive' };
  return map[m[1].toUpperCase()] ?? null;
}

/**
 * Resolve a window label ("Spirit Rush (R)", "Sonic Wave (Q)") to which
 * champion + ability slot it refers to — by ability name first ("Sonic Wave"
 * matches "Sonic Wave / Resonating Strike"), then by the trailing slot letter.
 */
export function resolveAbilityLabel(
  label: string,
  player: Champion,
  enemy: Champion,
): { champion: Champion; slot: AbilitySlot } | null {
  const name = label.replace(/\s*\([^)]*\).*$/, '').trim();
  const key = abilityKey(name);
  if (key) {
    for (const champion of [player, enemy]) {
      for (const slot of ABILITY_SLOTS) {
        const ability = champion.abilities[slot];
        if (!ability) continue;
        const ak = abilityKey(ability.name);
        if (ak === key || (key.length >= 4 && (ak.startsWith(key) || key.startsWith(ak)))) {
          return { champion, slot };
        }
      }
    }
  }
  const slot = abilitySlotFromLabel(label);
  // Ability windows usually track the enemy's cooldowns — default to them.
  return slot ? { champion: enemy, slot } : null;
}

/** Slot letters for display: P/Q/W/E/R (data-derived, not a UI string). */
export function slotLetter(slot: AbilitySlot): string {
  return slot === 'passive' ? 'P' : slot.toUpperCase();
}

export function getRune(id: string): Rune | undefined {
  return loadData().runeById.get(id);
}

export function getSpell(id: string): Spell | undefined {
  return loadData().spellById.get(id);
}

export function getMatchup(id: string): Matchup | undefined {
  return loadData().matchupById.get(id);
}

/** Curated matchup id / URL slug format: {player}-vs-{enemy}-{role} */
export function matchupIdFor(player: string, enemy: string, role: Role): string {
  return `${player}-vs-${enemy}-${role}`;
}

/**
 * Returns the curated guide keyed by URL slug ({player}-vs-{enemy}-{role}),
 * with `id` normalized to that slug so recents/favorites/feedback share one key space.
 */
export function getCounterGuide(slug: string): CounterGuide | undefined {
  const curated = getMatchup(slug);
  if (curated) return { ...curated, id: slug, autoGenerated: false };
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Champion filtering + fuzzy search                                    */
/* ------------------------------------------------------------------ */

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function initials(name: string): string {
  return name
    .split(/[\s'-]+/)
    .map((w) => w[0] ?? '')
    .join('');
}

/**
 * Fuzzy matching: "mf" matches "Miss Fortune", "zed" matches "Zed".
 * Returns a relevance score (higher = better) or 0 for no match.
 */
export function fuzzyScore(query: string, champion: Champion): number {
  const q = normalize(query);
  if (!q) return 1;
  const name = normalize(champion.name);
  const init = normalize(initials(champion.name));
  if (name === q) return 1000;
  if (name.startsWith(q)) return 900 - name.length;
  if (init.startsWith(q)) return 800 - init.length;
  if (init === q) return 850;
  // subsequence match with gap penalty
  let qi = 0;
  let gaps = 0;
  let last = -1;
  for (let i = 0; i < name.length && qi < q.length; i++) {
    if (name[i] === q[qi]) {
      if (last >= 0) gaps += i - last - 1;
      last = i;
      qi++;
    }
  }
  if (qi === q.length) return 500 - Math.min(gaps, 100);
  return 0;
}

export interface ChampionFilter {
  search?: string;
  role?: Role | 'all';
  /** When set, only champions that share a lane with this champion. */
  shareLaneWith?: string;
  exclude?: string;
}

export function filterChampions({ search, role, shareLaneWith, exclude }: ChampionFilter): Champion[] {
  const all = loadData().champions;
  const anchor = shareLaneWith ? getChampion(shareLaneWith) : undefined;
  return all
    .filter((c) => {
      if (exclude && c.id === exclude) return false;
      if (role && role !== 'all' && !c.commonLanes.includes(role)) return false;
      if (anchor && !anchor.commonLanes.some((lane) => c.commonLanes.includes(lane))) return false;
      return true;
    })
    .map((c) => ({ champ: c, score: search ? fuzzyScore(search, c) : 1 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.champ.name.localeCompare(b.champ.name))
    .map((x) => x.champ);
}
