import { Component, type ErrorInfo, type ReactNode } from 'react';
import { t } from '../lib/strings';

interface State {
  hasError: boolean;
}

/** Catches JSON/data load failures ("Data error. Clear cache and reload"). */
export default class DataErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Data load failure:', error, info);
  }

  async clearCacheAndReload() {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* cache API unavailable */
    }
    try {
      window.localStorage.clear();
    } catch {
      /* storage unavailable */
    }
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="max-w-md mx-auto mt-16 p-6 bg-bg-card rounded-lg border border-wr-red/50 text-center">
        <h1 className="text-xl font-bold text-wr-red">{t('card.errorTitle')}</h1>
        <p className="text-text-secondary mt-2">{t('card.errorBody')}</p>
        <button
          type="button"
          onClick={() => this.clearCacheAndReload()}
          className="pressable mt-4 min-h-tap px-5 rounded-sm bg-gold text-bg-primary font-semibold"
        >
          {t('card.errorClear')}
        </button>
      </div>
    );
  }
}
