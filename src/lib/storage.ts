import { STORAGE_KEYS, MAX_RECENTS } from './constants';

/** localStorage helpers — resilient to private mode / disabled storage. */

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — features degrade gracefully */
  }
}

function readJSON<T>(key: string, fallback: T): T {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  safeSet(key, JSON.stringify(value));
}

/* ---------------- Per-matchup enemy build (item id list) ---------------- */

function enemyBuildKey(matchupSlug: string): string {
  return `${STORAGE_KEYS.enemyBuildPrefix}${matchupSlug}`;
}

export function getEnemyBuild(matchupSlug: string): string[] {
  return readJSON<string[]>(enemyBuildKey(matchupSlug), []).filter((x) => typeof x === 'string');
}

export function saveEnemyBuild(matchupSlug: string, itemIds: string[]): void {
  writeJSON(enemyBuildKey(matchupSlug), itemIds);
}

/* ---------------- Recent matchups (matchup slug list) ---------------- */

export function getRecents(): string[] {
  return readJSON<string[]>(STORAGE_KEYS.recents, []);
}

export function pushRecent(matchupId: string): string[] {
  const list = getRecents().filter((id) => id !== matchupId);
  list.unshift(matchupId);
  const trimmed = list.slice(0, MAX_RECENTS);
  writeJSON(STORAGE_KEYS.recents, trimmed);
  return trimmed;
}

/* ---------------- Favorites ---------------- */

export function getFavorites(): string[] {
  return readJSON<string[]>(STORAGE_KEYS.favorites, []);
}

export function isFavorite(matchupId: string): boolean {
  return getFavorites().includes(matchupId);
}

export function toggleFavorite(matchupId: string): boolean {
  const favs = getFavorites();
  const next = favs.includes(matchupId) ? favs.filter((id) => id !== matchupId) : [matchupId, ...favs];
  writeJSON(STORAGE_KEYS.favorites, next);
  return next.includes(matchupId);
}

/* ---------------- Onboarding ---------------- */

export function isOnboarded(): boolean {
  return safeGet(STORAGE_KEYS.onboarded) === 'true';
}

export function setOnboarded(): void {
  safeSet(STORAGE_KEYS.onboarded, 'true');
}

/* ---------------- Section feedback: { "slug:section": 'up' | 'down' } ---------------- */

export type FeedbackMap = Record<string, 'up' | 'down'>;

export function getFeedback(matchupId: string, section: string): 'up' | 'down' | undefined {
  return readJSON<FeedbackMap>(STORAGE_KEYS.feedback, {})[`${matchupId}:${section}`];
}

export function setFeedback(matchupId: string, section: string, value: 'up' | 'down'): void {
  const map = readJSON<FeedbackMap>(STORAGE_KEYS.feedback, {});
  map[`${matchupId}:${section}`] = value;
  writeJSON(STORAGE_KEYS.feedback, map);
}
