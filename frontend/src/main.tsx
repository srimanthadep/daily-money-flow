import { createRoot } from "react-dom/client";
// @ts-ignore - Vite PWA virtual module
import { registerSW } from 'virtual:pwa-register';
import { ClerkProvider } from "@clerk/react";
import App from "./App.tsx";
import "./index.css";

// Automatically reload when a new service worker takes control
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Register Service Worker with instant automatic background update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Instantly activate new service worker and refresh the page automatically
    updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Check for updates when user returns to / opens the tab
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
      // Also periodically check for updates
      setInterval(() => {
        registration.update().catch(() => {});
      }, 15 * 60 * 1000);
    }
  },
  onOfflineReady() {
    console.log('Money Flow is ready for offline use.');
  },
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <App />
  </ClerkProvider>
);
