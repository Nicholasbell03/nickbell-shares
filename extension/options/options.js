const apiUrlInput = document.getElementById('api-url');
const apiTokenInput = document.getElementById('api-token');
const toggleTokenBtn = document.getElementById('toggle-token');
const saveBtn = document.getElementById('save-btn');
const testBtn = document.getElementById('test-btn');
const statusEl = document.getElementById('status');

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.hidden = false;
}

// Load saved settings
chrome.storage.sync.get(['apiUrl', 'apiToken'], (settings) => {
  apiUrlInput.value = settings.apiUrl || 'https://api.nickbell.dev';
  apiTokenInput.value = settings.apiToken || '';
});

// Toggle token visibility
toggleTokenBtn.addEventListener('click', () => {
  const isPassword = apiTokenInput.type === 'password';
  apiTokenInput.type = isPassword ? 'text' : 'password';
  toggleTokenBtn.textContent = isPassword ? '🙈' : '👁';
});

// Save settings
saveBtn.addEventListener('click', () => {
  const apiUrl = apiUrlInput.value.trim().replace(/\/+$/, '');
  const apiToken = apiTokenInput.value.trim();

  if (!apiUrl) {
    showStatus('API URL is required.', 'error');
    return;
  }

  if (!apiToken) {
    showStatus('API Token is required.', 'error');
    return;
  }

  chrome.storage.sync.set({ apiUrl, apiToken }, () => {
    showStatus('Settings saved.', 'success');
  });
});

// Test connection
testBtn.addEventListener('click', async () => {
  const apiUrl = apiUrlInput.value.trim().replace(/\/+$/, '');
  const apiToken = apiTokenInput.value.trim();

  if (!apiUrl || !apiToken) {
    showStatus('Fill in both fields first.', 'error');
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  statusEl.hidden = true;

  try {
    const response = await fetch(`${apiUrl}/api/user`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      showStatus(`Connected as ${user.name} (${user.email})`, 'success');
    } else if (response.status === 401) {
      showStatus('Invalid token. Generate a new one with the artisan command.', 'error');
    } else {
      showStatus(`Connection failed (${response.status})`, 'error');
    }
  } catch (err) {
    showStatus(`Connection error: ${err.message}`, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Test Connection';
  }
});
