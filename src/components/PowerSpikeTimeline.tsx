import { useEffect, useRef, useState } from 'react';
import FeedbackRow from './FeedbackRow';
import CollapsibleSection from './CollapsibleSection';
import { ADVANTAGE_COLORS } from '../lib/constants';
import { t } from '../lib/strings';
import type { CounterGuide } from '../lib/types';

/**
 * Horizontal power spike timeline:
 * green = you win, red = enemy wins, yellow = even.
 * Tap a segment to expand its detail. Segments fill left-to-right on first view.
 */
export default function PowerSpikeTimeline({ guide }: { guide: CounterGuide }) {
  const [active, setActive] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <CollapsibleSection title={t('card.powerSpikes')} emoji="⏱️" sectionKey="powerSpikes">
      <div ref={ref} className="flex gap-1.5" role="list" aria-label={t('card.powerSpikes')}>
        {guide.powerSpikes.map((spike, i) => {
          const color = ADVANTAGE_COLORS[spike.advantage];
          return (
            <button
              key={`${spike.phase}-${i}`}
              role="listitem"
              type="button"
              onClick={() => setActive(active === i ? null : i)}
              aria-expanded={active === i}
              className="pressable flex-1 min-w-0 text-left"
            >
              <div
                className={`h-2.5 rounded-full ${animate ? 'segment-fill' : ''}`}
                style={{ background: color, animationDelay: `${i * 120}ms` }}
              />
              <div
                className="mt-1.5 text-[11px] leading-tight font-semibold truncate"
                style={{ color }}
                title={spike.phase}
              >
                {spike.phase}
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-wide">
                {t(
                  `card.advantage${spike.advantage === 'player' ? 'Player' : spike.advantage === 'enemy' ? 'Enemy' : 'Even'}`,
                )}
              </div>
            </button>
          );
        })}
      </div>

      {active !== null && (
        <p className="mt-3 text-sm text-text-secondary bg-bg-elevated rounded-md p-3 border border-white/10">
          <strong style={{ color: ADVANTAGE_COLORS[guide.powerSpikes[active].advantage] }}>
            {guide.powerSpikes[active].phase}:
          </strong>{' '}
          {guide.powerSpikes[active].detail}
        </p>
      )}

      <FeedbackRow matchupId={guide.id} section="powerSpikes" />
    </CollapsibleSection>
  );
}
