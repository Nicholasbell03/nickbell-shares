// Extension settings storage.
//
// - apiUrl (not secret) lives in chrome.storage.sync.
// - apiToken (secret) lives in chrome.storage.local so it is never copied to
//   other Chrome profiles/devices signed into the same Google account.
//
// Older versions stored apiToken in chrome.storage.sync. loadSettings()
// migrates it to local storage on first read and removes it from sync.

async function loadSettings() {
  const [syncData, localData] = await Promise.all([
    chrome.storage.sync.get(['apiUrl', 'apiToken']),
    chrome.storage.local.get(['apiToken']),
  ]);

  let apiToken = localData.apiToken;

  if (syncData.apiToken !== undefined) {
    if (!apiToken) {
      apiToken = syncData.apiToken;
      await chrome.storage.local.set({ apiToken });
    }
    // Never leave the secret in sync storage.
    await chrome.storage.sync.remove('apiToken');
  }

  return { apiUrl: syncData.apiUrl, apiToken };
}

async function saveSettings(apiUrl, apiToken) {
  await chrome.storage.local.set({ apiToken });
  await chrome.storage.sync.set({ apiUrl });
  await chrome.storage.sync.remove('apiToken');
}
