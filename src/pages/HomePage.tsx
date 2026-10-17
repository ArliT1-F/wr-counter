import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChampionSelector from '../components/ChampionSelector';
import RecentFavorites from '../components/RecentFavorites';
import OnboardingTooltip from '../components/OnboardingTooltip';
import { ROLES, PATCH_VERSION, TRENDING_MATCHUP_IDS, ICON_BASE_URL } from '../lib/constants';
import { getChampion, matchupIdFor } from '../lib/dataLoader';
import { getChampions, getMatchups } from '../lib/dataLoader';
import { isOnboarded } from '../lib/storage';
import { t } from '../lib/strings';
import { track } from '../lib/analytics';
import GameIcon from '../components/GameIcon';
import type { Role } from '../lib/types';

const ROLE_EMOJI: Record<Role, string> = {
  top: '🛡️',
  jungle: '🌿',
  mid: '✨',
  bot: '🏹',
  support: '💚',
};

function TrendingList({ onPick }: { onPick: (id: string) => void }) {
  return (
    <aside className="bg-bg-card rounded-lg border border-white/5 p-4">
      <h2 className="font-semibold text-text-primary mb-3">🔥 {t('card.trending')}</h2>
      <ul className="space-y-1.5">
        {TRENDING_MATCHUP_IDS.map((id) => {
          const [pair, role] = [id.slice(0, id.lastIndexOf('-')), id.slice(id.lastIndexOf('-') + 1)];
          const [pid = '', eid = ''] = pair.split('-vs-');
          const player = getChampion(pid);
          const enemy = getChampion(eid);
          if (!player || !enemy) return null;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onPick(id)}
                className="pressable w-full flex items-center gap-2 p-2 rounded-sm hover:bg-bg-elevated text-left"
              >
                <GameIcon
                  src={`${ICON_BASE_URL}/champions/${player.icon}`}
                  fallbackLetter={player.name[0]}
                  fallbackColor={player.color}
                  size={28}
                  type="champion"
                />
                <GameIcon
                  src={`${ICON_BASE_URL}/champions/${enemy.icon}`}
                  fallbackLetter={enemy.name[0]}
                  fallbackColor={enemy.color}
                  size={28}
                  type="champion"
                />
                <span className="text-sm text-text-secondary truncate">
                  {player.name} vs {enemy.name}
                </span>
                <span className="ml-auto text-[10px] uppercase text-text-muted">{t(`roles.${role}`)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/** Screen 1: Champion Select. */
export default function HomePage() {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<string | undefined>();
  const [enemy, setEnemy] = useState<string | undefined>();
  const [role, setRole] = useState<Role | undefined>();
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboarded());
  const [refreshKey, setRefreshKey] = useState(0);

  const ready = Boolean(player && enemy && role);
  const slug = ready ? matchupIdFor(player!, enemy!, role!) : '';

  function go() {
    if (!ready) return;
    track('select_matchup', { matchup: slug });
    navigate(`/counter/${slug}`);
    setRefreshKey((k) => k + 1);
  }

  function pickRecent(id: string) {
    track('pick_recent', { matchup: id });
    navigate(`/counter/${id}`);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="page-enter max-w-5xl mx-auto">
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
        <div className="space-y-4">
          <section className="hero-banner rounded-lg p-5" aria-label={t('app.title')}>
            <h1 className="text-2xl font-bold text-text-primary leading-tight">{t('app.title')}</h1>
            <p className="mt-1.5 text-sm text-text-secondary max-w-lg leading-relaxed">{t('app.subtitle')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="hero-badge">{t('app.patchBadge', { version: PATCH_VERSION })}</span>
              <span className="hero-badge">{t('app.rosterBadge', { count: getChampions().length })}</span>
              <span className="hero-badge">{t('app.matchupsBadge', { count: getMatchups().length })}</span>
            </div>
          </section>

          <RecentFavorites onPick={pickRecent} refreshKey={refreshKey} />

          <ChampionSelector
            label={t('select.iAmPlaying')}
            selected={player}
            onSelect={(id) => {
              setPlayer(id);
              if (enemy === id) setEnemy(undefined);
            }}
            exclude={enemy}
            elementId="onboard-player"
          />

          <ChampionSelector
            label={t('select.against')}
            selected={enemy}
            onSelect={setEnemy}
            shareLaneWith={player}
            exclude={player}
            elementId="onboard-enemy"
          />

          <section aria-label={t('select.inRole')} id="onboard-role" className="bg-bg-card rounded-lg p-4 border border-white/5">
            <h2 className="text-lg font-semibold text-text-primary mb-3">{t('select.inRole')}</h2>
            <div className="flex gap-2 flex-wrap">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => setRole(r)}
                  className={`pressable min-h-tap min-w-tap px-4 rounded-sm border-2 flex items-center gap-2 text-sm font-semibold ${
                    role === r
                      ? 'border-gold bg-gold/20 text-gold'
                      : 'border-transparent bg-bg-elevated text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span aria-hidden="true">{ROLE_EMOJI[r]}</span>
                  {t(`roles.${r}`)}
                </button>
              ))}
            </div>
          </section>

          <div id="onboard-cta" className="pb-8">
            <button
              type="button"
              onClick={go}
              disabled={!ready}
              aria-disabled={!ready}
              className={`pressable w-full min-h-[52px] rounded-md text-lg font-bold ${
                ready
                  ? 'bg-gradient-to-r from-gold to-orange text-bg-primary shadow-lg shadow-gold/20 cta-glow'
                  : 'bg-bg-elevated text-text-muted cursor-not-allowed'
              }`}
            >
              {t('select.showCard')}
            </button>
          </div>
        </div>

        <div className="hidden lg:block space-y-4">
          <TrendingList onPick={pickRecent} />
          <p className="text-xs text-text-muted px-1">{t('app.subtitle')} · {t('app.patchBadge', { version: PATCH_VERSION })}</p>
        </div>
      </div>

      {showOnboarding && <OnboardingTooltip onDone={() => setShowOnboarding(false)} />}
    </div>
  );
}
