import GameIcon from './GameIcon';
import FeedbackRow from './FeedbackRow';
import CollapsibleSection from './CollapsibleSection';
import { ICON_BASE_URL } from '../lib/constants';
import { getSpell } from '../lib/dataLoader';
import { t } from '../lib/strings';
import type { CounterGuide } from '../lib/types';

function SpellRow({ spellIds, tone }: { spellIds: string[]; tone: 'default' | 'recommended' }) {
  const isGold = tone === 'recommended';
  return (
    <div
      className={`rounded-md p-2.5 border ${isGold ? 'border-gold/60 bg-gold/10' : 'border-white/10 bg-bg-elevated opacity-70'}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isGold ? 'text-gold' : 'text-text-muted'}`}>
        {t(isGold ? 'card.recommended' : 'card.default')}
      </p>
      <ul className="flex flex-wrap gap-2">
        {spellIds.map((id) => {
          const spell = getSpell(id);
          return (
            <li key={id} title={spell?.description} className="flex items-center gap-1.5 text-xs text-text-primary">
              <GameIcon
                src={spell ? `${ICON_BASE_URL}/spells/${spell.icon}` : undefined}
                fallbackLetter={(spell?.name ?? id)[0]}
                fallbackColor={isGold ? '#C89B3C' : '#3A4557'}
                size={28}
                type="spell"
              />
              <span>{spell?.name ?? id}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Side-by-side summoner spell comparison (same format as runes). */
export default function SummonerSpellsSection({ guide }: { guide: CounterGuide }) {
  return (
    <CollapsibleSection title={t('card.summonerSpells')} emoji="⚡" sectionKey="summonerSpells">
      <div className="grid grid-cols-2 gap-2.5">
        <SpellRow spellIds={guide.summonerSpells.default} tone="default" />
        <SpellRow spellIds={guide.summonerSpells.recommended} tone="recommended" />
      </div>
      <p className="text-sm text-text-secondary mt-3">{guide.summonerSpells.reason}</p>
      <FeedbackRow matchupId={guide.id} section="summonerSpells" />
    </CollapsibleSection>
  );
}
