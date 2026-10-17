import GameIcon from './GameIcon';
import { ICON_BASE_URL } from '../lib/constants';
import { getChampion } from '../lib/dataLoader';
import { getFavorites, getRecents } from '../lib/storage';
import { t } from '../lib/strings';

interface RecentFavoritesProps {
  onPick: (matchupId: string) => void;
  /** Bump to re-read localStorage after a card visit. */
  refreshKey?: number;
}

interface ChipProps {
  matchupId: string;
  onPick: (matchupId: string) => void;
}

function MatchupChip({ matchupId, onPick }: ChipProps) {
  // slug: {player}-vs-{enemy}-{role}
  const [pair, role] = [matchupId.slice(0, matchupId.lastIndexOf('-')), matchupId.slice(matchupId.lastIndexOf('-') + 1)];
  const [playerId = '', enemyId = ''] = pair.split('-vs-');
  const player = getChampion(playerId);
  const enemy = getChampion(enemyId);
  if (!player || !enemy) return null;

  return (
    <button
      type="button"
      onClick={() => onPick(matchupId)}
      aria-label={`${player.name} vs ${enemy.name} — ${t(`roles.${role}`)}`}
      className="pressable shrink-0 flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-bg-elevated border border-white/10 hover:border-gold/60"
    >
      <GameIcon
        src={`${ICON_BASE_URL}/champions/${player.icon}`}
        fallbackLetter={player.name[0]}
        fallbackColor={player.color}
        size={28}
        type="champion"
      />
      <span className="text-xs text-text-secondary font-semibold">{t('card.vs')}</span>
      <GameIcon
        src={`${ICON_BASE_URL}/champions/${enemy.icon}`}
        fallbackLetter={enemy.name[0]}
        fallbackColor={enemy.color}
        size={28}
        type="champion"
      />
    </button>
  );
}

/** Horizontal scrollable chips for recent + favorite matchups (hidden when empty). */
export default function RecentFavorites({ onPick, refreshKey = 0 }: RecentFavoritesProps) {
  const recents = getRecents();
  const favorites = getFavorites();
  if (recents.length === 0 && favorites.length === 0) return null;

  return (
    <div key={refreshKey} className="space-y-3">
      {recents.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-2">🕐 {t('select.recent')}</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {recents.map((id) => (
              <MatchupChip key={`r-${id}`} matchupId={id} onPick={onPick} />
            ))}
          </div>
        </div>
      )}
      {favorites.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-2">⭐ {t('select.favorites')}</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {favorites.map((id) => (
              <MatchupChip key={`f-${id}`} matchupId={id} onPick={onPick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
