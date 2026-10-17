import type { DamageType, Role, WindowType, Advantage, Difficulty } from './types';

/**
 * Current Wild Rift patch the data files were written for.
 * NOTE: update together with data/*.json `patchVersion` fields.
 */
export const PATCH_VERSION = '7.3';

/** Bump when icon assets change — cache-busts every icon request (?v=). */
export const ASSET_VERSION = '7.3-r2';

/** Champion/item/rune/spell icons live under this base URL (override with VITE_ICON_URL). */
export const ICON_BASE_URL = import.meta.env.VITE_ICON_URL || '/icons';

export const ROLES: Role[] = ['top', 'jungle', 'mid', 'bot', 'support'];

export const DAMAGE_COLORS: Record<DamageType, string> = {
  ad: '#E84057',
  ap: '#0984E3',
  mixed: '#9B59B6',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#00B894',
  medium: '#F39C12',
  hard: '#E84057',
};

export const ADVANTAGE_COLORS: Record<Advantage, string> = {
  player: '#00B894',
  enemy: '#E84057',
  even: '#F39C12',
};

export const WINDOW_COLORS: Record<WindowType, string> = {
  dodge: '#0984E3',
  punish: '#00B894',
  counter: '#F39C12',
};

/** localStorage keys */
export const STORAGE_KEYS = {
  recents: 'wr-counter:recents',
  favorites: 'wr-counter:favorites',
  onboarded: 'wr-counter:onboarded',
  feedback: 'wr-counter:feedback',
  enemyBuildPrefix: 'wr-counter:enemy-build:',
} as const;

export const MAX_RECENTS = 5;

/** Deterministic "trending matchups" list for the desktop sidebar. */
export const TRENDING_MATCHUP_IDS = [
  'darius-vs-sett-top',
  'ahri-vs-zed-mid',
  'zed-vs-ahri-mid',
  'jinx-vs-miss-fortune-bot',
  'yasuo-vs-zed-mid',
  'garen-vs-darius-top',
  'kaisa-vs-ezreal-bot',
  'thresh-vs-nami-support',
  'lee-sin-vs-vi-jungle',
  'lux-vs-zed-mid',
];

export const FEEDBACK_SECTIONS = [
  'itemBuild',
  'runeSwap',
  'summonerSpells',
  'powerSpikes',
  'abilityWindows',
  'waveManagement',
] as const;
