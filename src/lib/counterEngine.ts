import { getChampion, getItem, matchupIdFor } from './dataLoader';
import { PATCH_VERSION } from './constants';
import { t } from './strings';
import type {
  Champion,
  CounterGuide,
  Difficulty,
  PowerSpikeEntry,
  Role,
  AbilityWindow,
} from './types';

/**
 * Fallback recommendation engine (client-side, no API):
 *
 *  1. Determine enemy damage type (AD/AP/mixed) from champion data
 *  2. If enemy is AD  -> Plated Steelcaps + armor items
 *  3. If enemy is AP  -> Mercury's Treads + MR items
 *  4. If enemy has healing -> Grievous Wounds item
 *  5. If enemy has CC -> Mercury's Treads + tenacity runes
 *  6. Compare power spike levels -> generate basic timeline
 *  7. Flag the result with the "auto-generated" badge
 *
 * All copy comes from strings/en.json ("engine.*" templates).
 */

function itemName(id: string): string {
  return getItem(id)?.name ?? id;
}

function pickArmorPath(hasHealing: boolean, hasCC: boolean): string[] {
  const items = ['plated-steelcaps'];
  items.push(hasHealing ? 'thornmail' : 'dead-mans-plate');
  items.push(hasCC ? 'randuins-omen' : 'spirit-visage');
  return items;
}

function pickMrPath(hasHealing: boolean, hasCC: boolean): string[] {
  const items = ['mercury-treads'];
  items.push(hasHealing ? 'spirit-visage' : 'force-of-nature');
  items.push(hasCC ? 'mercury-treads' : 'abyssal-mask');
  if (items[2] === 'mercury-treads') items[2] = 'warmogs-armor';
  return items;
}

function pickMixedPath(hasHealing: boolean): string[] {
  return ['mercury-treads', hasHealing ? 'steraks-gage' : 'guardian-angel', 'deaths-dance'];
}

function difficultyFor(player: Champion, enemy: Champion): Difficulty {
  const playerMelee = player.stats.rangeType === 'melee';
  const enemyMelee = enemy.stats.rangeType === 'melee';
  let score = 0;
  if (playerMelee && !enemyMelee) score += 1;
  if (!playerMelee && enemyMelee) score -= 1;
  if (enemy.hasCC && !player.hasCC) score += 1;
  if (player.hasCC && !enemy.hasCC) score -= 1;
  if (enemy.hasHealing && !player.hasHealing) score += 1;
  if (score >= 2) return 'hard';
  if (score <= -1) return 'easy';
  return 'medium';
}

function spikesFromChampion(player: Champion, enemy: Champion): PowerSpikeEntry[] {
  const spikes: PowerSpikeEntry[] = [];
  let itemsSeen = 0;
  for (const key of player.powerSpikes) {
    if (spikes.length >= 4) break;
    if (key.startsWith('level')) {
      const level = key.replace('level', '');
      spikes.push({
        phase: t('engine.spikePhaseLevel', { level }),
        advantage: Number(level) <= 3 ? 'player' : 'even',
        detail: t('engine.spikeLevel', { level, enemyName: enemy.name }),
      });
    } else {
      itemsSeen += 1;
      if (itemsSeen <= 2) {
        spikes.push({
          phase: t(itemsSeen === 1 ? 'engine.spikePhaseItem1' : 'engine.spikePhaseItem2'),
          advantage: 'player',
          detail: t('engine.spikeItem', { item: itemName(key) }),
        });
      }
    }
  }
  spikes.push({
    phase: t('engine.spikePhaseLate'),
    advantage: 'even',
    detail: t('engine.spikeLate'),
  });
  return spikes.slice(0, 5);
}

function windowsFromEnemy(enemy: Champion): AbilityWindow[] {
  return [
    {
      type: 'dodge',
      ability: `${enemy.abilities.r.name} (R)`,
      detail: t('engine.windowDodge', { ability: `${enemy.abilities.r.name} (R)`, enemyName: enemy.name }),
    },
    {
      type: 'punish',
      ability: `${enemy.abilities.q.name} (Q)`,
      detail: t('engine.windowPunish', { ability: `${enemy.abilities.q.name} (Q)`, enemyName: enemy.name }),
    },
    {
      type: 'counter',
      ability: `${enemy.abilities.e.name} (E)`,
      detail: t('engine.windowCounter', { ability: `${enemy.abilities.e.name} (E)`, enemyName: enemy.name }),
    },
  ];
}

export function generateBasicCounter(playerId: string, enemyId: string, role: Role): CounterGuide {
  const player = getChampion(playerId);
  const enemy = getChampion(enemyId);
  if (!player || !enemy) {
    throw new Error(`Cannot generate guide: unknown champion (${playerId} vs ${enemyId})`);
  }

  const damage = enemy.damageType;
  const coreIds =
    damage === 'ad'
      ? pickArmorPath(enemy.hasHealing, enemy.hasCC)
      : damage === 'ap'
        ? pickMrPath(enemy.hasHealing, enemy.hasCC)
        : pickMixedPath(enemy.hasHealing);

  const corePath = coreIds.map((itemId, i) => ({
    itemId,
    timing: i === 0 ? 'first back' : i === 1 ? 'first core item' : 'second item',
    reason: t(
      i === 0
        ? 'engine.itemReasonBoots'
        : enemy.hasHealing && i === 1
          ? 'engine.itemReasonHealing'
          : damage === 'ad'
            ? 'engine.itemReasonAd'
            : damage === 'ap'
              ? 'engine.itemReasonAp'
              : 'engine.itemReasonHealing',
      { enemyName: enemy.name },
    ),
  }));

  const avoidItems = [
    {
      itemId: damage === 'ad' ? 'mercury-treads' : 'plated-steelcaps',
      reason: t(damage === 'ad' ? 'engine.avoidReasonAd' : 'engine.avoidReasonAp', { enemyName: enemy.name }),
    },
    ...(enemy.hasHealing
      ? [{ itemId: 'warmogs-armor', reason: t('engine.avoidReasonHealing', { enemyName: enemy.name }) }]
      : []),
  ];

  // Rune swap: keep the player's default page, swap in tenacity vs heavy CC.
  const recommendedRunes = [...player.defaultRunes];
  if (enemy.hasCC && !recommendedRunes.includes('legend-tenacity')) {
    recommendedRunes[recommendedRunes.length - 1] = 'legend-tenacity';
  }

  // Summoner spells: Ignite vs healing threats, otherwise default.
  const recommendedSpells = [...player.defaultSpells];
  if (enemy.hasHealing && !recommendedSpells.includes('ignite') && role !== 'jungle') {
    recommendedSpells[1] = 'ignite';
  }

  return {
    id: matchupIdFor(player.id, enemy.id, role),
    playerChampion: player.id,
    enemyChampion: enemy.id,
    role,
    difficulty: difficultyFor(player, enemy),
    summary: t('engine.summary', {
      player: player.name,
      enemy: enemy.name,
      role: t(`roles.${role}`),
      enemyName: enemy.name,
    }),
    itemBuild: { corePath, avoidItems },
    runeSwap: {
      default: player.defaultRunes,
      recommended: recommendedRunes,
      reason: t(enemy.hasCC ? 'engine.runeReasonCC' : 'engine.runeReasonDefault', { enemyName: enemy.name }),
    },
    summonerSpells: {
      default: player.defaultSpells,
      recommended: recommendedSpells,
      reason: t(enemy.hasHealing ? 'engine.spellReasonHealing' : 'engine.spellReasonDefault', {
        enemyName: enemy.name,
      }),
    },
    powerSpikes: spikesFromChampion(player, enemy),
    abilityWindows: windowsFromEnemy(enemy),
    waveManagement: t(`engine.wave${role.charAt(0).toUpperCase()}${role.slice(1)}`, { enemyName: enemy.name }),
    lastUpdated: '2026-10-17',
    patchVersion: PATCH_VERSION,
    autoGenerated: true,
  };
}
