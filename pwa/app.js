// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// --- Elements ---
const screens = {
  setup: document.getElementById('setup-screen'),
  share: document.getElementById('share-screen'),
  loading: document.getElementById('loading-screen'),
  success: document.getElementById('success-screen'),
};

function showScreen(screen) {
  Object.values(screens).forEach(el => el.hidden = true);
  screen.hidden = false;
}

// --- Source type detection ---
function detectSourceType(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (['youtube.com', 'youtu.be', 'm.youtube.com'].includes(host)) return 'youtube';
    if (['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host)) return 'x_post';
  } catch {
    // invalid URL
  }
  return 'webpage';
}

function updateSourceIcon(iconEl, type) {
  const config = {
    youtube: { text: '▶', className: 'youtube', title: 'YouTube' },
    x_post: { text: '𝕏', className: 'x-post', title: 'X / Twitter' },
    webpage: { text: '🌐', className: 'webpage', title: 'Webpage' },
  };
  const c = config[type] || config.webpage;
  iconEl.textContent = c.text;
  iconEl.className = `source-icon ${c.className}`;
  iconEl.title = c.title;
}

// --- Share target URL extraction ---
function extractSharedUrl() {
  const params = new URLSearchParams(window.location.search);

  // Try the explicit url param first
  const urlParam = params.get('url');
  if (urlParam && isValidUrl(urlParam)) return urlParam;

  // Some apps (YouTube, X) put the URL in the text param
  const textParam = params.get('text');
  if (textParam) {
    const extracted = extractUrlFromText(textParam);
    if (extracted) return extracted;
    // If text itself is a URL
    if (isValidUrl(textParam)) return textParam;
  }

  // Fallback to title param
  const titleParam = params.get('title');
  if (titleParam && isValidUrl(titleParam)) return titleParam;

  return '';
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractUrlFromText(text) {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

// --- Settings ---
function getSettings() {
  return {
    apiUrl: localStorage.getItem('apiUrl') || '',
    apiToken: localStorage.getItem('apiToken') || '',
  };
}

function saveSettings(apiUrl, apiToken) {
  localStorage.setItem('apiUrl', apiUrl.replace(/\/+$/, ''));
  localStorage.setItem('apiToken', apiToken);
}

function hasSettings() {
  const s = getSettings();
  return s.apiUrl && s.apiToken;
}

// --- API ---
async function submitShare(url, commentary) {
  const { apiUrl, apiToken } = getSettings();

  const response = await fetch(`${apiUrl}/api/v1/shares`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      url,
      commentary: commentary || undefined,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401) throw new Error('Invalid API token. Check your settings.');
    if (response.status === 422 && data?.errors) {
      const messages = Object.values(data.errors).flat();
      throw new Error(messages.join(', '));
    }
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

// --- Setup screen ---
function initSetup() {
  const apiUrlInput = document.getElementById('setup-api-url');
  const apiTokenInput = document.getElementById('setup-api-token');
  const toggleBtn = document.getElementById('setup-toggle-token');
  const saveBtn = document.getElementById('setup-save-btn');
  const errorEl = document.getElementById('setup-error');

  // Pre-fill if settings exist
  const existing = getSettings();
  if (existing.apiUrl) apiUrlInput.value = existing.apiUrl;

  toggleBtn.addEventListener('click', () => {
    const isPassword = apiTokenInput.type === 'password';
    apiTokenInput.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? '🙈' : '👁';
  });

  saveBtn.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim();
    const apiToken = apiTokenInput.value.trim();

    errorEl.hidden = true;

    if (!apiUrl || !apiToken) {
      errorEl.textContent = 'Both fields are required.';
      errorEl.hidden = false;
      return;
    }

    // Test connection
    saveBtn.disabled = true;
    saveBtn.textContent = 'Testing...';

    try {
      const response = await fetch(`${apiUrl.replace(/\/+$/, '')}/api/user`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(response.status === 401
          ? 'Invalid token.'
          : `Connection failed (${response.status})`);
      }

      saveSettings(apiUrl, apiToken);
      initShareScreen();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save & Continue';
    }
  });

  showScreen(screens.setup);
}

// --- Share screen ---
function initShareScreen() {
  const urlInput = document.getElementById('share-url');
  const sourceIcon = document.getElementById('source-icon');
  const commentaryInput = document.getElementById('share-commentary');
  const submitBtn = document.getElementById('share-submit-btn');
  const errorEl = document.getElementById('share-error');
  const settingsBtn = document.getElementById('settings-btn');
  const successLink = document.getElementById('success-link');
  const shareAnotherBtn = document.getElementById('share-another-btn');

  // Pre-fill from share target params
  const sharedUrl = extractSharedUrl();
  urlInput.value = sharedUrl;

  // Update source icon on URL change
  function refreshIcon() {
    updateSourceIcon(sourceIcon, detectSourceType(urlInput.value));
  }
  refreshIcon();
  urlInput.addEventListener('input', refreshIcon);

  // Clean the URL bar (remove share target query params)
  if (window.location.search) {
    history.replaceState(null, '', '/');
  }

  showScreen(screens.share);

  // Focus commentary if URL is pre-filled, otherwise URL
  if (sharedUrl) {
    commentaryInput.focus();
  } else {
    urlInput.focus();
  }

  // Settings
  settingsBtn.addEventListener('click', () => {
    initSetup();
  });

  // Submit
  submitBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    const commentary = commentaryInput.value.trim();

    errorEl.hidden = true;

    if (!url) {
      errorEl.textContent = 'URL is required.';
      errorEl.hidden = false;
      return;
    }

    if (!isValidUrl(url)) {
      errorEl.textContent = 'Enter a valid URL (starting with http:// or https://).';
      errorEl.hidden = false;
      return;
    }

    showScreen(screens.loading);

    try {
      const data = await submitShare(url, commentary);
      const slug = data?.data?.slug;
      successLink.href = slug
        ? `https://nickbell.dev/shares/${slug}`
        : 'https://nickbell.dev/shares';
      showScreen(screens.success);
    } catch (err) {
      showScreen(screens.share);
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });

  // Share another
  shareAnotherBtn.addEventListener('click', () => {
    urlInput.value = '';
    commentaryInput.value = '';
    refreshIcon();
    showScreen(screens.share);
    urlInput.focus();
  });
}

// --- Init ---
if (hasSettings()) {
  initShareScreen();
} else {
  initSetup();
}
