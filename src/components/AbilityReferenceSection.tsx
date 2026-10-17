import GameIcon from './GameIcon';
import CollapsibleSection from './CollapsibleSection';
import { ICON_BASE_URL } from '../lib/constants';
import { getChampion, slotLetter } from '../lib/dataLoader';
import type { AbilitySlot } from '../lib/dataLoader';
import { t } from '../lib/strings';
import type { Champion, CounterGuide } from '../lib/types';

const SLOTS: AbilitySlot[] = ['passive', 'q', 'w', 'e', 'r'];

/** Cooldown badge from official rank arrays: [9,8,8,7] → "9→7s", [12] → "12s". */
function cooldownText(cooldown: number[] | undefined): string | null {
  if (!cooldown || cooldown.length === 0) return null;
  const first = cooldown[0];
  const last = cooldown[cooldown.length - 1];
  return cooldown.length === 1 ? `${first}s` : `${first}→${last}s`;
}

function KitBlock({ champ, toneLabel }: { champ: Champion; toneLabel: string }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <GameIcon
          src={`${ICON_BASE_URL}/champions/${champ.icon}`}
          fallbackLetter={champ.name[0]}
          fallbackColor={champ.color}
          size={28}
          type="champion"
        />
        {champ.name}
        <span className="ml-auto text-[10px] uppercase tracking-wider text-text-muted font-medium">{toneLabel}</span>
      </h3>
      <ul className="mt-1.5">
        {SLOTS.map((slot) => {
          const ability = champ.abilities[slot];
          if (!ability) return null;
          const cd = cooldownText(ability.cooldown);
          return (
            <li key={slot} className="flex gap-2.5 py-2 border-t border-white/5">
              <GameIcon
                src={`${ICON_BASE_URL}/abilities/${champ.id}-${slot}.png`}
                fallbackLetter={slotLetter(slot)}
                size={36}
                type="ability"
              />
              <div className="min-w-0">
                <p className="text-sm text-text-primary leading-tight">
                  <span className="inline-block w-5 text-[10px] font-bold text-gold/80 align-middle">{slotLetter(slot)}</span>
                  {ability.name}
                  {cd && (
                    <span className="ml-2 text-[10px] text-text-muted font-normal whitespace-nowrap">
                      {t('abilities.cd')} {cd}
                    </span>
                  )}
                </p>
                {ability.description && (
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{ability.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Quick reference for both kits: official names, short summaries, cooldowns. */
export default function AbilityReferenceSection({ guide }: { guide: CounterGuide }) {
  const player = getChampion(guide.playerChampion);
  const enemy = getChampion(guide.enemyChampion);
  if (!player || !enemy) return null;
  return (
    <CollapsibleSection title={t('card.abilities')} emoji="📖" sectionKey="abilities">
      <p className="text-xs text-text-muted leading-relaxed mb-3">{t('abilities.subtitle')}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <KitBlock champ={player} toneLabel={t('stats.you')} />
        <KitBlock champ={enemy} toneLabel={t('stats.them')} />
      </div>
    </CollapsibleSection>
  );
}
