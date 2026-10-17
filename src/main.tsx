import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { registerSW } from 'virtual:pwa-register';
import { initAnalytics } from './lib/analytics';

// Offline-first: service worker precaches HTML/JS/CSS/JSON + icons.
registerSW({ immediate: true });

// Privacy-friendly analytics — no-op unless VITE_ANALYTICS_DOMAIN is configured.
initAnalytics();

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename === '/' ? undefined : basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
