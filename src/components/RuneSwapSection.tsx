import GameIcon from './GameIcon';
import FeedbackRow from './FeedbackRow';
import CollapsibleSection from './CollapsibleSection';
import { ICON_BASE_URL } from '../lib/constants';
import { getRune } from '../lib/dataLoader';
import { t } from '../lib/strings';
import type { CounterGuide } from '../lib/types';

function RuneRow({ runeIds, tone }: { runeIds: string[]; tone: 'default' | 'recommended' }) {
  const isGold = tone === 'recommended';
  return (
    <div
      className={`rounded-md p-2.5 border ${isGold ? 'border-gold/60 bg-gold/10' : 'border-white/10 bg-bg-elevated opacity-70'}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isGold ? 'text-gold' : 'text-text-muted'}`}>
        {t(isGold ? 'card.recommended' : 'card.default')}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {runeIds.map((id) => {
          const rune = getRune(id);
          return (
            <li
              key={id}
              title={rune?.description}
              className={`flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-xs ${
                isGold ? 'bg-bg-card text-text-primary' : 'bg-bg-card text-text-secondary'
              }`}
            >
              <GameIcon
                src={rune ? `${ICON_BASE_URL}/runes/${rune.icon}` : undefined}
                fallbackLetter={(rune?.name ?? id)[0]}
                fallbackColor={isGold ? '#C89B3C' : '#3A4557'}
                size={22}
                type="rune"
              />
              <span>{rune?.name ?? id}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Side-by-side "Default" (grayed) vs "Recommended" (gold) rune pages + reason. */
export default function RuneSwapSection({ guide }: { guide: CounterGuide }) {
  return (
    <CollapsibleSection title={t('card.runeSwap')} emoji="🔮" sectionKey="runeSwap">
      <div className="grid grid-cols-2 gap-2.5">
        <RuneRow runeIds={guide.runeSwap.default} tone="default" />
        <RuneRow runeIds={guide.runeSwap.recommended} tone="recommended" />
      </div>
      <p className="text-sm text-text-secondary mt-3">{guide.runeSwap.reason}</p>
      <FeedbackRow matchupId={guide.id} section="runeSwap" />
    </CollapsibleSection>
  );
}
