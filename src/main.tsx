import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root")!;
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the boot splash once mounted
requestAnimationFrame(() => {
  const boot = document.getElementById("boot");
  if (boot) boot.remove();
});

// Register the service worker for PWA/offline support.
// Only in production builds — in dev, Vite serves modules that would confuse the SW cache.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}
