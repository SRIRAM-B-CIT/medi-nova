'use client';

import { useEffect } from 'react';
import App from './App';

export default function NextApp() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    };

    window.addEventListener('load', registerServiceWorker);
    if (document.readyState === 'complete') registerServiceWorker();

    return () => window.removeEventListener('load', registerServiceWorker);
  }, []);

  return <App />;
}
