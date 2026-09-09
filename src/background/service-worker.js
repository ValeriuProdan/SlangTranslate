/**
 * Keeps the toolbar badge in sync with what each tab is doing -- how much
 * corporate speak it has absorbed, or that it is currently snoozed -- and
 * seeds defaults on install.
 */
const DEFAULTS = { enabled: true, language: 'ro', strictness: 'normal', highlight: true };

const COLOR_ACTIVE = '#FF7A3D';
const COLOR_PAUSED = '#6B7280';

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(DEFAULTS, function (stored) {
    chrome.storage.sync.set(Object.assign({}, DEFAULTS, stored));
  });
});

chrome.runtime.onMessage.addListener(function (message, sender) {
  if (!message || message.type !== 'slang:count') return false;
  const tabId = sender.tab && sender.tab.id;
  if (tabId === undefined) return false;

  if (message.paused) {
    // "||" rather than a pause glyph, which renders as tofu on some platforms.
    chrome.action.setBadgeText({ tabId: tabId, text: '||' });
    chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: COLOR_PAUSED });
    chrome.action.setTitle({ tabId: tabId, title: 'Slang Translate - paused' });
    return false;
  }

  const text = message.count > 999 ? '999+' : String(message.count || '');
  chrome.action.setBadgeText({ tabId: tabId, text: message.count ? text : '' });
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: COLOR_ACTIVE });
  chrome.action.setTitle({ tabId: tabId, title: 'Slang Translate' });
  return false;
});
