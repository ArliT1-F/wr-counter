import { useState } from 'react';
import { t } from '../lib/strings';
import type { Champion, Role } from '../lib/types';

interface ShareButtonProps {
  player: Champion;
  enemy: Champion;
  role: Role;
  summary: string;
}

/** Web Share API with clipboard fallback + toast. */
export default function ShareButton({ player, enemy, role, summary }: ShareButtonProps) {
  const [toast, setToast] = useState(false);

  async function share() {
    const url = window.location.href;
    const text = t('card.shareText', {
      player: player.name,
      enemy: enemy.name,
      role: t(`roles.${role}`),
      summary,
      url,
    });
    try {
      if (navigator.share) {
        await navigator.share({ title: `${player.name} vs ${enemy.name}`, text, url });
        return;
      }
      throw new Error('no web share');
    } catch {
      try {
        await navigator.clipboard.writeText(`${text}`);
      } catch {
        // clipboard unavailable — last resort: do nothing visible
      }
      setToast(true);
      window.setTimeout(() => setToast(false), 2200);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={share}
        aria-label={t('card.share')}
        className="pressable min-h-tap px-3 rounded-sm bg-bg-elevated border border-gold/40 text-gold text-sm font-semibold hover:border-gold"
      >
        {t('card.share')}
      </button>
      {toast && (
        <div
          role="status"
          className="toast fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md bg-bg-elevated border border-teal text-text-primary shadow-lg"
        >
          {t('card.linkCopied')}
        </div>
      )}
    </>
  );
}
