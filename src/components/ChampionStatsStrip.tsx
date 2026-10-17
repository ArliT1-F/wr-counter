import GameIcon from './GameIcon';
import { ICON_BASE_URL } from '../lib/constants';
import { t } from '../lib/strings';
import type { Champion, ChampionStats } from '../lib/types';

interface ChampionStatsStripProps {
  player: Champion;
  enemy: Champion;
}

interface Row {
  key: string;
  labelKey: string;
  pick: (s: ChampionStats) => number;
  growth: (s: ChampionStats) => number | null;
  decimals?: number;
  suffix?: string;
}

const ROWS: Row[] = [
  { key: 'hp', labelKey: 'stats.hp', pick: (s) => s.hp, growth: (s) => s.hpPerLevel, decimals: 0 },
  { key: 'ad', labelKey: 'stats.ad', pick: (s) => s.attackDamage, growth: (s) => s.attackDamagePerLevel, decimals: 1 },
  { key: 'armor', labelKey: 'stats.armor', pick: (s) => s.armor, growth: (s) => s.armorPerLevel, decimals: 1 },
  { key: 'mr', labelKey: 'stats.mr', pick: (s) => s.magicResist, growth: (s) => s.magicResistPerLevel, decimals: 1 },
  { key: 'ms', labelKey: 'stats.ms', pick: (s) => s.moveSpeed, growth: () => null, decimals: 0 },
  { key: 'range', labelKey: 'stats.range', pick: (s) => s.attackRange, growth: () => null, decimals: 0 },
];

function fmt(value: number, decimals = 0): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(decimals);
}

/**
 * Level-1 base-stat comparison (official patch data): You vs the enemy.
 * Range row also shows the melee/ranged classification used by the engine.
 */
export default function ChampionStatsStrip({ player, enemy }: ChampionStatsStripProps) {
  return (
    <section className="mt-4 bg-bg-card rounded-lg border border-white/5 p-4" aria-label={t('stats.title')}>
      <h2 className="font-semibold text-text-primary flex items-center gap-2">
        <span aria-hidden="true">📊</span> {t('stats.title')}
        <span className="ml-auto text-[11px] text-text-muted font-normal">{t('stats.subtitle')}</span>
      </h2>
      <table className="w-full mt-3 text-sm border-collapse">
        <thead>
          <tr>
            <th scope="col" className="text-left pb-2">
              <span className="inline-flex items-center gap-1.5">
                <GameIcon
                  src={`${ICON_BASE_URL}/champions/${player.icon}`}
                  fallbackLetter={player.name[0]}
                  fallbackColor={player.color}
                  size={22}
                  type="champion"
                />
                <span className="text-text-secondary font-medium">{t('stats.you')}</span>
              </span>
            </th>
            <th scope="col" className="pb-2" />
            <th scope="col" className="text-right pb-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-enemy font-medium">{t('stats.them')}</span>
                <GameIcon
                  src={`${ICON_BASE_URL}/champions/${enemy.icon}`}
                  fallbackLetter={enemy.name[0]}
                  fallbackColor={enemy.color}
                  size={22}
                  type="champion"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key} className="border-t border-white/5">
              <td className="py-2 text-left">
                <span className="text-text-primary font-medium">{fmt(row.pick(player.stats), row.decimals)}</span>
                {row.growth(player.stats) !== null && (
                  <span className="block text-[11px] text-text-muted">
                    {t('stats.growth', { value: fmt(row.growth(player.stats) as number, 1) })}
                  </span>
                )}
              </td>
              <th scope="row" className="py-2 text-[11px] uppercase tracking-wider text-text-muted font-medium whitespace-nowrap">
                {t(row.labelKey)}
              </th>
              <td className="py-2 text-right">
                <span className="text-enemy font-medium">{fmt(row.pick(enemy.stats), row.decimals)}</span>
                {row.growth(enemy.stats) !== null && (
                  <span className="block text-[11px] text-text-muted">
                    {t('stats.growth', { value: fmt(row.growth(enemy.stats) as number, 1) })}
                  </span>
                )}
              </td>
            </tr>
          ))}
          <tr className="border-t border-white/5">
            <td className="py-2">
              <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-text-secondary">
                {player.stats.rangeType === 'melee' ? t('stats.melee') : t('stats.ranged')}
              </span>
            </td>
            <th scope="row" className="py-2 text-[11px] uppercase tracking-wider text-text-muted font-medium" />
            <td className="py-2 text-right">
              <span className="inline-flex items-center rounded-full bg-enemy/15 text-enemy px-2 py-0.5 text-[11px]">
                {enemy.stats.rangeType === 'melee' ? t('stats.melee') : t('stats.ranged')}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
