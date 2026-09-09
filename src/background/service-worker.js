/**
 * Keeps the toolbar badge in sync with how much corporate speak each tab has
 * absorbed, and seeds defaults on install.
 */
const DEFAULTS = { enabled: true, strictness: 'normal', showOriginal: true };

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(DEFAULTS, function (stored) {
    chrome.storage.sync.set(Object.assign({}, DEFAULTS, stored));
  });
});

chrome.runtime.onMessage.addListener(function (message, sender) {
  if (!message || message.type !== 'slang:count') return false;
  const tabId = sender.tab && sender.tab.id;
  if (tabId === undefined) return false;

  const text = message.count > 999 ? '999+' : String(message.count || '');
  chrome.action.setBadgeText({ tabId: tabId, text: message.count ? text : '' });
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#CE1126' });
  return false;
});
