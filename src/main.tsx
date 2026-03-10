import { createRoot } from "react-dom/client";
// @ts-ignore - Vite PWA virtual module
import { registerSW } from 'virtual:pwa-register';
import App from "./App.tsx";
import "./index.css";

// Register Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('A new version is available! Refresh now to get the latest features?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Money Flow is ready for offline use.');
  },
});

createRoot(document.getElementById("root")!).render(<App />);
