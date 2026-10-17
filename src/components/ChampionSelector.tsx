import { useState } from 'react';
import GameIcon from './GameIcon';
import { ICON_BASE_URL, ROLES, DAMAGE_COLORS } from '../lib/constants';
import { filterChampions } from '../lib/dataLoader';
import { t } from '../lib/strings';
import type { Champion, Role } from '../lib/types';

interface ChampionSelectorProps {
  label: string;
  selected?: string;
  onSelect: (id: string) => void;
  /** Filter to champions sharing a lane with this champion id. */
  shareLaneWith?: string;
  exclude?: string;
  elementId?: string;
}

/** Searchable champion grid: search bar + role tabs + damage-type dots. */
export default function ChampionSelector({
  label,
  selected,
  onSelect,
  shareLaneWith,
  exclude,
  elementId,
}: ChampionSelectorProps) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  const champions = filterChampions({ search: query, role: roleFilter, shareLaneWith, exclude });

  return (
    <section aria-label={label} id={elementId} className="bg-bg-card rounded-lg p-4 border border-white/5">
      <h2 className="text-lg font-semibold text-text-primary mb-3">{label}</h2>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('select.searchPlaceholder')}
        aria-label={t('select.searchPlaceholder')}
        className="w-full min-h-tap px-3 py-2 rounded-sm bg-bg-elevated border border-white/10 text-text-primary placeholder:text-text-muted focus:border-gold outline-none"
      />

      <div role="tablist" aria-label={label} className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
        {(['all', ...ROLES] as const).map((role) => (
          <button
            key={role}
            role="tab"
            aria-selected={roleFilter === role}
            onClick={() => setRoleFilter(role)}
            className={`pressable min-h-tap px-3 rounded-sm text-sm whitespace-nowrap border ${
              roleFilter === role
                ? 'bg-gold/20 border-gold text-gold font-semibold'
                : 'bg-bg-elevated border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t(`roles.${role}`)}
          </button>
        ))}
      </div>

      {champions.length === 0 ? (
        <p className="mt-6 text-text-secondary text-center">{t('select.noResults')}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-6" role="listbox" aria-label={label}>
          {champions.map((champ: Champion) => {
            const isSelected = champ.id === selected;
            return (
              <li key={champ.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelect(champ.id)}
                  className={`pressable w-full flex flex-col items-center gap-1.5 p-2 rounded-md border-2 bg-bg-elevated hover:border-gold/50 ${
                    isSelected ? 'selected-champ' : 'border-transparent'
                  }`}
                >
                  <span className="relative">
                    <GameIcon
                      src={`${ICON_BASE_URL}/champions/${champ.icon}`}
                      fallbackLetter={champ.name[0]}
                      fallbackColor={champ.color}
                      size={48}
                      type="champion"
                    />
                    <span
                      aria-label={t(`select.damage${champ.damageType === 'ad' ? 'Ad' : champ.damageType === 'ap' ? 'Ap' : 'Mixed'}`)}
                      role="img"
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-elevated"
                      style={{ background: DAMAGE_COLORS[champ.damageType] }}
                    />
                  </span>
                  <span className="text-xs text-text-secondary leading-tight text-center truncate w-full">
                    {champ.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
