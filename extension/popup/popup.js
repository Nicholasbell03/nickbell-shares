const STATES = {
  configNeeded: document.getElementById('config-needed'),
  mainForm: document.getElementById('main-form'),
  loading: document.getElementById('loading'),
  success: document.getElementById('success'),
};

const urlInput = document.getElementById('url');
const sourceIcon = document.getElementById('source-icon');
const commentaryInput = document.getElementById('commentary');
const submitBtn = document.getElementById('submit-btn');
const errorMsg = document.getElementById('error-msg');
const shareLink = document.getElementById('share-link');

function showState(state) {
  Object.values(STATES).forEach(el => el.hidden = true);
  state.hidden = false;
}

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

function updateSourceIcon(type) {
  const config = {
    youtube: { text: '▶', className: 'youtube', title: 'YouTube' },
    x_post: { text: '𝕏', className: 'x-post', title: 'X / Twitter' },
    webpage: { text: '🌐', className: 'webpage', title: 'Webpage' },
  };
  const c = config[type] || config.webpage;
  sourceIcon.textContent = c.text;
  sourceIcon.className = `source-icon ${c.className}`;
  sourceIcon.title = c.title;
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['apiUrl', 'apiToken'], resolve);
  });
}

async function submitShare(apiUrl, apiToken, url, commentary) {
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

async function init() {
  const settings = await loadSettings();

  if (!settings.apiUrl || !settings.apiToken) {
    showState(STATES.configNeeded);
    document.getElementById('open-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab?.url || '';
  const sourceType = detectSourceType(currentUrl);

  urlInput.value = currentUrl;
  updateSourceIcon(sourceType);
  showState(STATES.mainForm);

  // Focus commentary field
  commentaryInput.focus();

  submitBtn.addEventListener('click', async () => {
    errorMsg.hidden = true;
    showState(STATES.loading);

    try {
      const data = await submitShare(
        settings.apiUrl,
        settings.apiToken,
        currentUrl,
        commentaryInput.value.trim()
      );

      const slug = data?.data?.slug;
      if (slug) {
        shareLink.href = `https://nickbell.dev/shares/${slug}`;
      } else {
        shareLink.href = 'https://nickbell.dev/shares';
      }
      showState(STATES.success);
    } catch (err) {
      showState(STATES.mainForm);
      showError(err.message);
    }
  });
}

init();
