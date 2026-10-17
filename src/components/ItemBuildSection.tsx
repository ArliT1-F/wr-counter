import GameIcon from './GameIcon';
import FeedbackRow from './FeedbackRow';
import CollapsibleSection from './CollapsibleSection';
import { ICON_BASE_URL } from '../lib/constants';
import { getItem } from '../lib/dataLoader';
import { t } from '../lib/strings';
import type { CounterGuide } from '../lib/types';

/** Ordered item build path with icons, cost, timing and reasons + red "Avoid" items. */
export default function ItemBuildSection({ guide }: { guide: CounterGuide }) {
  return (
    <CollapsibleSection title={t('card.itemBuild')} emoji="🛡️" sectionKey="itemBuild">
      <ol className="space-y-3">
        {guide.itemBuild.corePath.map((step, i) => {
          const item = getItem(step.itemId);
          return (
            <li key={`${step.itemId}-${i}`} className="flex gap-3">
              <span className="flex flex-col items-center gap-1 pt-0.5">
                <GameIcon
                  src={item ? `${ICON_BASE_URL}/items/${item.icon}` : undefined}
                  fallbackLetter={(item?.name ?? step.itemId)[0]}
                  fallbackColor="#3A4557"
                  size={44}
                  type="item"
                />
                <span
                  aria-hidden="true"
                  className="w-5 h-5 rounded-full bg-gold text-bg-primary text-xs font-bold flex items-center justify-center"
                >
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-text-primary">{item?.name ?? step.itemId}</span>
                  {item && (
                    <span className="text-xs text-gold">
                      {item.cost}
                      {t('card.gold')}
                    </span>
                  )}
                  <span className="text-xs text-teal">{step.timing}</span>
                </div>
                <p className="text-sm text-text-secondary mt-0.5">{step.reason}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {guide.itemBuild.avoidItems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <h3 className="text-sm font-semibold text-wr-red mb-2">🚫 {t('card.avoid')}</h3>
          <ul className="space-y-2">
            {guide.itemBuild.avoidItems.map((avoid) => {
              const item = getItem(avoid.itemId);
              return (
                <li key={avoid.itemId} className="flex gap-3 items-start">
                  <GameIcon
                    src={item ? `${ICON_BASE_URL}/items/${item.icon}` : undefined}
                    fallbackLetter={(item?.name ?? avoid.itemId)[0]}
                    fallbackColor="#3A4557"
                    size={36}
                    type="item"
                    className="opacity-60"
                  />
                  <div>
                    <span className="text-sm font-semibold text-wr-red line-through">
                      {item?.name ?? avoid.itemId}
                    </span>
                    <p className="text-sm text-text-secondary mt-0.5">{avoid.reason}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <FeedbackRow matchupId={guide.id} section="itemBuild" />
    </CollapsibleSection>
  );
}
