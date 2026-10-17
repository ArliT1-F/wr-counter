import FeedbackRow from './FeedbackRow';
import CollapsibleSection from './CollapsibleSection';
import GameIcon from './GameIcon';
import { WINDOW_COLORS, ICON_BASE_URL } from '../lib/constants';
import { getChampion, resolveAbilityLabel, resolveSpellLabel } from '../lib/dataLoader';
import { t } from '../lib/strings';
import type { AbilityWindow, CounterGuide } from '../lib/types';

/** Badge-colored card: DODGE = blue, PUNISH = green, COUNTER = orange. */
function WindowCard({ window: win, guide }: { window: AbilityWindow; guide: CounterGuide }) {
  const color = WINDOW_COLORS[win.type];
  const player = getChampion(guide.playerChampion);
  const enemy = getChampion(guide.enemyChampion);
  const resolved = player && enemy ? resolveAbilityLabel(win.ability, player, enemy) : null;
  const spell = resolved ? undefined : resolveSpellLabel(win.ability);
  return (
    <li className="bg-bg-elevated rounded-md border border-white/10 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: `${color}22`, color, border: `1px solid ${color}66` }}
        >
          {t(`windows.${win.type}`)}
        </span>
        {resolved && (
          <GameIcon
            src={`${ICON_BASE_URL}/abilities/${resolved.champion.id}-${resolved.slot}.png`}
            fallbackLetter={win.ability[0]}
            size={22}
            type="ability"
          />
        )}
        {spell && (
          <GameIcon
            src={`${ICON_BASE_URL}/spells/${spell.icon}`}
            fallbackLetter={spell.name[0]}
            size={22}
            type="spell"
          />
        )}
        <span className="font-semibold text-text-primary text-sm">{win.ability}</span>
      </div>
      <p className="text-sm text-text-secondary mt-1.5">{win.detail}</p>
    </li>
  );
}

export default function AbilityWindowCard({ guide }: { guide: CounterGuide }) {
  return (
    <CollapsibleSection title={t('card.abilityWindows')} emoji="🎯" sectionKey="abilityWindows">
      <ul className="space-y-2.5">
        {guide.abilityWindows.map((win, i) => (
          <WindowCard key={`${win.ability}-${i}`} window={win} guide={guide} />
        ))}
      </ul>
      <FeedbackRow matchupId={guide.id} section="abilityWindows" />
    </CollapsibleSection>
  );
}
