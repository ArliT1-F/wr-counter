// "Counter their build" — adapts the recommended build to the items the
// user's lane opponent is actually buying. Pure functions; UI-agnostic.
// The UI renders each suggestion as [item chip] + reason sentence.
import type { BuildAdaptation, Champion, Item } from './types';
import { t } from './strings';

export interface EnemyBuildSignals {
  armor: number;
  magicResist: number;
  health: number;
  attackDamage: number;
  abilityPower: number;
  critChance: number;
  attackSpeed: number;
  vamp: number;
  healItems: string[];
  critItems: string[];
  asItems: string[];
  hpItems: string[];
  mrItems: string[];
  armorItems: string[];
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Aggregate what the enemy's completed items are actually giving them. */
export function readEnemyBuild(items: Item[]): EnemyBuildSignals {
  const s: EnemyBuildSignals = {
    armor: 0, magicResist: 0, health: 0, attackDamage: 0, abilityPower: 0,
    critChance: 0, attackSpeed: 0, vamp: 0,
    healItems: [], critItems: [], asItems: [], hpItems: [], mrItems: [], armorItems: [],
  };
  for (const item of items) {
    const st = item.stats ?? {};
    s.armor += num(st.armor);
    s.magicResist += num(st.magicResist);
    s.health += num(st.health);
    s.attackDamage += num(st.attackDamage);
    s.abilityPower += num(st.abilityPower);
    s.critChance += num(st.critChance);
    s.attackSpeed += num(st.attackSpeed);
    s.vamp += num(st.vamp) + num(st.magicVamp);
    if (num(st.vamp) + num(st.magicVamp) > 0 || /hydra|shieldbow|bloodthirster|gunblade|visage|ruined/.test(item.id)) s.healItems.push(item.id);
    if (num(st.critChance) > 0) s.critItems.push(item.id);
    if (num(st.attackSpeed) > 0) s.asItems.push(item.id);
    if (num(st.health) > 0) s.hpItems.push(item.id);
    if (num(st.magicResist) > 0) s.mrItems.push(item.id);
    if (num(st.armor) > 0) s.armorItems.push(item.id);
  }
  return s;
}

interface Rule {
  id: string;
  when: (s: EnemyBuildSignals, player: Champion, enemy: Champion) => boolean;
  suggest: (player: Champion) => string[];
  reason: (s: EnemyBuildSignals) => string;
}

// Rule order = priority. At most one item per rule keeps the advice short.
const RULES: Rule[] = [
  {
    id: 'armor',
    when: (s) => s.armor >= 40 || s.armorItems.length >= 2,
    suggest: (p) => (p.damageType === 'ap'
      ? ['void-staff']
      : p.damageType === 'mixed'
        ? ['mortal-reminder', 'void-staff']
        : ['mortal-reminder', 'black-cleaver', 'seryldas-grudge']),
    reason: (s) => t('adapt.armor', { value: String(Math.round(s.armor)) }),
  },
  {
    id: 'mr',
    when: (s) => s.magicResist >= 40 || s.mrItems.length >= 2,
    suggest: (p) => (p.damageType === 'ap' || p.damageType === 'mixed'
      ? ['void-staff']
      : ['black-cleaver', 'mortal-reminder']),
    reason: (s) => t('adapt.mr', { value: String(Math.round(s.magicResist)) }),
  },
  {
    id: 'healing',
    when: (s, _p, enemy) => s.healItems.length >= 1 || enemy.hasHealing,
    suggest: (p) => (p.damageType === 'ap'
      ? ['morellonomicon']
      : p.damageType === 'mixed'
        ? ['morellonomicon', 'mortal-reminder']
        : ['mortal-reminder', 'thornmail']),
    reason: () => t('adapt.healing'),
  },
  {
    id: 'crit',
    when: (s) => s.critItems.length >= 2,
    suggest: () => ['randuins-omen', 'frozen-heart'],
    reason: () => t('adapt.crit'),
  },
  {
    id: 'attackSpeed',
    when: (s) => s.asItems.length >= 2 && s.attackSpeed >= 30,
    suggest: () => ['frozen-heart', 'thornmail'],
    reason: (s) => t('adapt.attackSpeed', { value: String(Math.round(s.attackSpeed)) }),
  },
  {
    id: 'health',
    when: (s) => s.health >= 900,
    suggest: (p) => (p.damageType === 'ap' ? ['liandrys-torment'] : ['blade-of-the-ruined-king', 'divine-sunderer']),
    reason: (s) => t('adapt.health', { value: String(Math.round(s.health)) }),
  },
  {
    id: 'ap',
    when: (s) => s.abilityPower >= 150,
    suggest: () => ['maw-of-malmortius', 'spirit-visage', 'force-of-nature'],
    reason: (s) => t('adapt.ap', { value: String(Math.round(s.abilityPower)) }),
  },
  {
    id: 'ad',
    when: (s) => s.attackDamage >= 150,
    suggest: () => ['guardian-angel', 'thornmail'],
    reason: (s) => t('adapt.ad', { value: String(Math.round(s.attackDamage)) }),
  },
];

/**
 * Recommendations for `player` against `enemy`'s purchased `enemyItems`.
 * `alreadyBuilt` (item ids in the core path) filters redundant suggestions.
 */
export function adaptBuild(
  player: Champion,
  enemy: Champion,
  enemyItems: Item[],
  alreadyBuilt: string[] = [],
): BuildAdaptation[] {
  if (enemyItems.length === 0) return [];
  const s = readEnemyBuild(enemyItems);
  const out: BuildAdaptation[] = [];
  const seen = new Set(alreadyBuilt.map((i) => i.toLowerCase()));
  for (const rule of RULES) {
    if (out.length >= 4) break;
    if (!rule.when(s, player, enemy)) continue;
    const reason = rule.reason(s);
    for (const itemId of rule.suggest(player)) {
      const key = itemId.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ itemId, reason });
      break;
    }
  }
  return out;
}
