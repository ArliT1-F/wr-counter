import { useEffect, useMemo, useState } from 'react';
import GameIcon from './GameIcon';
import { getItems, getItem } from '../lib/dataLoader';
import { adaptBuild } from '../lib/buildAdapter';
import { getEnemyBuild, saveEnemyBuild } from '../lib/storage';
import { ICON_BASE_URL } from '../lib/constants';
import { t } from '../lib/strings';
import { track } from '../lib/analytics';
import type { Champion } from '../lib/types';

interface EnemyBuildPanelProps {
  /** Matchup slug — the enemy build persists per matchup. */
  matchupSlug: string;
  player: Champion;
  enemy: Champion;
  /** Core-path item ids — already-built items are not suggested again. */
  alreadyBuilt: string[];
}

/**
 * "Enemy Items" picker + "Counter their build" adaptation.
 * The user taps the items their lane opponent is buying; the adapter turns
 * those signals (armor, MR, crit, healing, HP, AS) into counter-build advice.
 */
export default function EnemyBuildPanel({ matchupSlug, player, enemy, alreadyBuilt }: EnemyBuildPanelProps) {
  const [selected, setSelected] = useState<string[]>(() => getEnemyBuild(matchupSlug));
  const [query, setQuery] = useState('');

  useEffect(() => {
    setSelected(getEnemyBuild(matchupSlug));
    setQuery('');
  }, [matchupSlug]);

  const allItems = useMemo(() => getItems(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.id.includes(q) ||
      item.category.includes(q) ||
      Object.keys(item.stats ?? {}).some((stat) => stat.toLowerCase().includes(q)),
    );
  }, [allItems, query]);

  const selectedItems = useMemo(
    () => selected.map((id) => getItem(id)).filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [selected],
  );

  const adaptations = useMemo(
    () => adaptBuild(player, enemy, selectedItems, alreadyBuilt),
    [player, enemy, selectedItems, alreadyBuilt],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveEnemyBuild(matchupSlug, next);
      track('customize_build', { matchup: matchupSlug, item: id, action: prev.includes(id) ? 'remove' : 'add' });
      return next;
    });
  }

  function clearAll() {
    saveEnemyBuild(matchupSlug, []);
    setSelected([]);
  }

  return (
    <section className="mt-4 bg-bg-card rounded-lg border border-white/5 p-4" aria-label={t('enemies.title')}>
      <h2 className="font-semibold text-text-primary flex items-center gap-2">
        <span aria-hidden="true">🛒</span> {t('enemies.title')}
        {selected.length > 0 && (
          <span className="ml-auto inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-gold/20 text-gold text-xs font-bold">
            {selected.length}
          </span>
        )}
      </h2>
      <p className="text-xs text-text-muted mt-1 leading-relaxed">{t('enemies.subtitle')}</p>

      {/* Selected enemy build */}
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {selectedItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => toggle(item.id)}
            aria-label={t('enemies.remove', { name: item.name })}
            title={t('enemies.remove', { name: item.name })}
            className="pressable inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 pl-1 pr-2.5 py-1 text-xs text-text-primary min-h-tap"
          >
            <GameIcon
              src={`${ICON_BASE_URL}/items/${item.icon}`}
              fallbackLetter={item.name[0]}
              size={22}
              type="item"
            />
            {item.name}
            <span aria-hidden="true" className="text-text-muted">✕</span>
          </button>
        ))}
        {selected.length === 0 && <p className="text-xs text-text-muted">{t('enemies.empty')}</p>}
        {selected.length > 1 && (
          <button
            type="button"
            onClick={clearAll}
            className="pressable text-xs text-text-muted underline min-h-tap px-2"
          >
            {t('enemies.clear')}
          </button>
        )}
      </div>

      {/* Search + picker grid */}
      <label className="sr-only" htmlFor="enemy-item-search">{t('enemies.searchLabel')}</label>
      <input
        id="enemy-item-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('enemies.search')}
        className="mt-3 w-full h-11 px-3 rounded-sm bg-bg-elevated border border-white/10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/60"
      />
      <div className="mt-2 max-h-64 overflow-y-auto rounded-sm border border-white/5 p-1" role="group" aria-label={t('enemies.title')}>
        {filtered.length === 0 && <p className="text-xs text-text-muted p-3">{t('enemies.noResults')}</p>}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {filtered.map((item) => {
            const isOn = selected.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={isOn}
                  className={`pressable w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs min-h-tap ${
                    isOn ? 'bg-gold/15 border border-gold/50' : 'border border-transparent hover:bg-bg-elevated'
                  }`}
                >
                  <GameIcon
                    src={`${ICON_BASE_URL}/items/${item.icon}`}
                    fallbackLetter={item.name[0]}
                    size={26}
                    type="item"
                  />
                  <span className="flex-1 truncate text-text-primary">{item.name}</span>
                  <span className={`text-[10px] ${isOn ? 'text-gold' : 'text-text-muted'}`}>{item.cost}g</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Counter their build */}
      <div className="mt-4 rounded-lg border border-white/5 bg-bg-primary/40 p-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <span aria-hidden="true">🛠️</span> {t('adapt.title')}
          {selected.length > 0 && (
            <span className="text-[11px] text-text-muted font-normal">
              {t('adapt.lead', { count: selected.length })}
            </span>
          )}
        </h3>
        {adaptations.length === 0 ? (
          <p className="text-xs text-text-muted mt-2 leading-relaxed">{t('adapt.none')}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {adaptations.map((ad) => {
              const item = getItem(ad.itemId);
              if (!item) return null;
              return (
                <li key={ad.itemId} className="flex items-start gap-2">
                  <GameIcon
                    src={`${ICON_BASE_URL}/items/${item.icon}`}
                    fallbackLetter={item.name[0]}
                    size={32}
                    type="item"
                  />
                  <div>
                    <p className="text-sm text-text-primary font-medium leading-tight">{item.name}</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{ad.reason}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
