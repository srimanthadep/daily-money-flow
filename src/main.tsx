import { createRoot } from "react-dom/client";
<<<<<<< HEAD
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

=======
import App from "./App.tsx";
import "./index.css";

>>>>>>> c858d41a280eb1830d0b49e066a0a7ae053c50cc
createRoot(document.getElementById("root")!).render(<App />);
