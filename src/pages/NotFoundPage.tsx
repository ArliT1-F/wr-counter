import { Link } from 'react-router-dom';
import { t } from '../lib/strings';

/** 404 page — also used for invalid matchup URLs. */
export default function NotFoundPage() {
  return (
    <div className="page-enter max-w-md mx-auto mt-16 text-center p-8 bg-bg-card rounded-lg border border-white/10">
      <p className="text-5xl mb-3" aria-hidden="true">
        🌀
      </p>
      <h1 className="text-2xl font-bold text-text-primary">404</h1>
      <p className="text-text-secondary mt-2">{t('card.notFoundBody')}</p>
      <Link
        to="/"
        className="pressable inline-flex items-center mt-5 min-h-tap px-6 rounded-sm bg-gold text-bg-primary font-semibold"
      >
        {t('card.backToSelect')}
      </Link>
    </div>
  );
}
