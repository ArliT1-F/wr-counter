/**
 * Privacy-friendly analytics hook (Plausible-compatible).
 *
 * Disabled by default — the app makes NO network calls at runtime.
 * To enable, set VITE_ANALYTICS_DOMAIN at build time (e.g. wr-counter.example.com)
 * and self-host or subscribe to Plausible/Umami. No cookies, no identifiers.
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

let enabled = false;

export function initAnalytics(): void {
  const domain = import.meta.env.VITE_ANALYTICS_DOMAIN as string | undefined;
  if (!domain || typeof document === 'undefined') return;
  enabled = true;
  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = domain;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

export function track(event: string, props?: Record<string, string>): void {
  if (!enabled || !window.plausible) return;
  window.plausible(event, props ? { props } : undefined);
}
