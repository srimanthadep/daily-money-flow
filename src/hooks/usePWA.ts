import { useState, useEffect } from 'react';

let _deferredPrompt: any = null;
const _subscribers = new Set<Function>();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredPrompt = e;
  _subscribers.forEach(fn => fn());
});

window.addEventListener('appinstalled', () => {
  _deferredPrompt = null;
  _subscribers.forEach(fn => fn());
});

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(_deferredPrompt);
  const isInstallable = !!installPrompt;

  useEffect(() => {
    const sync = () => setInstallPrompt(_deferredPrompt);
    _subscribers.add(sync);
    sync();
    return () => { _subscribers.delete(sync); };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      _deferredPrompt = null;
      setInstallPrompt(null);
    }
  };

  return { isInstallable, installApp };
}
