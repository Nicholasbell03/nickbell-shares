# NickBell Shares

Chrome Extension + PWA for quickly sharing URLs with commentary to [nickbell.dev](https://nickbell.dev).

Both clients authenticate via Sanctum bearer tokens and call `POST /api/v1/shares`. The backend auto-fetches OG metadata, detects source type (YouTube, X, webpage), and extracts embed data — the clients just send a URL and optional commentary.

## Chrome Extension

Click the extension icon on any page to share it. Works independently per Chrome profile (work + personal get separate token storage via `chrome.storage.sync`).

- Manifest V3 with `activeTab` + `storage` permissions
- Auto-detects current tab URL and source type
- Options page for API URL and token configuration
- Dark theme matching nickbell.dev

### Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` directory

## PWA

Mobile share target for Android. Share from YouTube, X, Chrome, or any app and the PWA appears in the share sheet with the URL pre-filled.

- Web Share Target API integration
- Extracts URLs from various app share formats
- Offline-capable via service worker
- Mobile-first, thumb-friendly design

### Install

Visit [share.nickbell.dev](https://share.nickbell.dev) on your phone and tap **Install** or **Add to Home Screen**.

## Setup

Both clients need a Sanctum API token. Generate one with:

```bash
php artisan app:generate-api-token --user=1 --name="shares-extension"
```

The token is shown once — save it and paste it into the extension options page or PWA setup screen.

## Structure

```
nickbell-shares/
├── extension/
│   ├── manifest.json       # Manifest V3 config
│   ├── popup/              # Extension popup UI
│   ├── options/            # Settings page
│   ├── background.js       # Service worker (minimal)
│   └── icons/
└── pwa/
    ├── index.html          # Share form + setup
    ├── manifest.json       # Web app manifest with share_target
    ├── sw.js               # Service worker for offline caching
    ├── app.js              # App logic
    ├── app.css             # Styles
    └── icons/
```

No build tools or frameworks — vanilla HTML/CSS/JS throughout.

## Related Repositories

- [personal-site](https://github.com/Nicholasbell03/personal-site) — Laravel API backend
- [nickbell-frontend](https://github.com/Nicholasbell03/nickbell-frontend) — React frontend
