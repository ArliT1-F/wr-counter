import { useState, type ReactNode } from 'react';
import { t } from '../lib/strings';

interface CollapsibleSectionProps {
  title: string;
  emoji: string;
  sectionKey: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** Card-stack section with smooth height animation (300ms). */
export default function CollapsibleSection({
  title,
  emoji,
  sectionKey,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section aria-label={title} className="bg-bg-card rounded-lg border border-white/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`section-${sectionKey}`}
        className="pressable w-full flex items-center gap-2.5 px-4 py-3.5 min-h-tap text-left hover:bg-white/[0.03]"
      >
        <span aria-hidden="true" className="text-xl">
          {emoji}
        </span>
        <h2 className="flex-1 font-semibold text-text-primary">{title}</h2>
        <span aria-hidden="true" className={`text-text-secondary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
        <span className="sr-only">{open ? t('card.collapse') : t('card.expand')}</span>
      </button>
      <div id={`section-${sectionKey}`} className="accordion-grid" data-collapsed={!open}>
        <div className="accordion-inner">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
