import { useState } from 'react';
import { getFeedback, setFeedback } from '../lib/storage';
import { t } from '../lib/strings';

interface FeedbackRowProps {
  matchupId: string;
  section: string;
}

/** "Was this helpful? 👍 👎" — stored in localStorage keyed by matchup ID + section. */
export default function FeedbackRow({ matchupId, section }: FeedbackRowProps) {
  const [vote, setVote] = useState<'up' | 'down' | undefined>(() => getFeedback(matchupId, section));

  function voteNow(value: 'up' | 'down') {
    setFeedback(matchupId, section, value);
    setVote(value);
  }

  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
      <span>{t('card.helpful')}</span>
      <button
        type="button"
        aria-label={t('card.helpfulYes')}
        aria-pressed={vote === 'up'}
        onClick={() => voteNow('up')}
        className={`pressable min-w-tap min-h-tap px-2 rounded-sm text-base ${
          vote === 'up' ? 'bg-green/20 text-green' : 'bg-bg-elevated hover:brightness-110'
        }`}
      >
        👍
      </button>
      <button
        type="button"
        aria-label={t('card.helpfulNo')}
        aria-pressed={vote === 'down'}
        onClick={() => voteNow('down')}
        className={`pressable min-w-tap min-h-tap px-2 rounded-sm text-base ${
          vote === 'down' ? 'bg-wr-red/20 text-wr-red' : 'bg-bg-elevated hover:brightness-110'
        }`}
      >
        👎
      </button>
    </div>
  );
}
