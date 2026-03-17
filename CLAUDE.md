# nickbell-shares

Chrome Extension + PWA for quick URL sharing to the nickbell.dev API.

## PWA Service Worker Cache

When changing any PWA files in `pwa/`, always bump `CACHE_NAME` in `pwa/sw.js` (e.g. `nb-shares-v4` → `nb-shares-v5`). This forces the service worker to re-install and clear the old cache so users get the latest version.
