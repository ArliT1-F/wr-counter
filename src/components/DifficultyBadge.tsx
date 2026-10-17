import type { Difficulty } from '../lib/types';
import { DIFFICULTY_COLORS } from '../lib/constants';
import { t } from '../lib/strings';

export default function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const color = DIFFICULTY_COLORS[difficulty];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{ background: `${color}22`, color, border: `1px solid ${color}66` }}
    >
      {t(`card.difficulty${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`)}
    </span>
  );
}
