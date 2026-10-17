import { useEffect, useState } from 'react';
import { setOnboarded } from '../lib/storage';
import { t } from '../lib/strings';

interface Step {
  targetId: string;
  textKey: string;
}

const STEPS: Step[] = [
  { targetId: 'onboard-player', textKey: 'onboarding.step1' },
  { targetId: 'onboard-enemy', textKey: 'onboarding.step2' },
  { targetId: 'onboard-role', textKey: 'onboarding.step3' },
  { targetId: 'onboard-cta', textKey: 'onboarding.step4' },
];

/**
 * First-visit tooltip sequence. Highlights each selector with a spotlight ring,
 * offers "Got it" / "Skip all", and never shows again after dismissal.
 */
export default function OnboardingTooltip({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const target = document.getElementById(STEPS[step].targetId);
    target?.classList.add('spotlight');
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return () => target?.classList.remove('spotlight');
  }, [step]);

  function dismiss() {
    setOnboarded();
    onDone();
  }

  function next() {
    if (step >= STEPS.length - 1) {
      dismiss();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.step1')}
      className="fixed inset-x-0 bottom-0 z-50 p-4 pb-8"
    >
      <div className="max-w-md mx-auto bg-bg-elevated border border-gold/60 rounded-lg p-4 shadow-2xl">
        <p className="text-text-primary font-medium">{t(STEPS[step].textKey)}</p>
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={next}
            className="pressable min-h-tap px-5 rounded-sm bg-gold text-bg-primary font-semibold"
          >
            {step >= STEPS.length - 1 ? t('onboarding.gotIt') : t('onboarding.next')}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="pressable min-h-tap px-4 rounded-sm text-text-secondary hover:text-text-primary"
          >
            {t('onboarding.skipAll')}
          </button>
          <span className="ml-auto text-xs text-text-muted" aria-hidden="true">
            {step + 1}/{STEPS.length}
          </span>
        </div>
      </div>
    </div>
  );
}
