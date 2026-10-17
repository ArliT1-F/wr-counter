import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CounterPage from './pages/CounterPage';
import NotFoundPage from './pages/NotFoundPage';
import DataErrorBoundary from './components/DataErrorBoundary';
import { PATCH_VERSION } from './lib/constants';
import { t } from './lib/strings';

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

function Header() {
  const online = useOnline();
  return (
    <header className="sticky top-0 z-40 bg-bg-primary/95 backdrop-blur border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link to="/" className="pressable flex items-center gap-2" aria-label={t('app.title')}>
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-bg-primary"
            style={{ background: 'var(--gold)' }}
          >
            WR
          </span>
          <span className="font-bold text-lg text-text-primary">{t('app.title')}</span>
        </Link>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated text-text-secondary border border-white/10">
          {t('app.patchBadge', { version: PATCH_VERSION })}
        </span>
        {!online && (
          <span
            role="status"
            className="text-xs px-2 py-0.5 rounded-full border border-orange/60 text-orange font-semibold"
          >
            {t('app.offline')}
          </span>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 mt-8">
      <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-text-muted space-y-1.5">
        <p>
          {t('app.footerAnalytics')}{' '}
          <a
            href="https://plausible.io/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-text-secondary"
          >
            {t('app.footerAnalyticsLink')}
          </a>
        </p>
        <p>{t('app.footerRights')}</p>
      </div>
    </footer>
  );
}

/** Fade + slide-up on route change. */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <main key={location.pathname} className="page-enter max-w-5xl mx-auto px-4 py-6">
      <DataErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/counter/:matchup" element={<CounterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </DataErrorBoundary>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AnimatedRoutes />
      <Footer />
    </div>
  );
}
