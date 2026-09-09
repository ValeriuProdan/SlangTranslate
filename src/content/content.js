/**
 * Extension glue: reads settings, drives the rewriter over the mail UI, and
 * keeps rewriting as the client swaps content in.
 *
 * The actual DOM work lives in src/lib/dom-rewrite.js. Everything here is
 * local to the tab; nothing is ever sent anywhere.
 */
(function () {
  'use strict';

  const DEFAULTS = { enabled: true, strictness: 'normal', showOriginal: true };
  const matcher = window.SlangMatcher.createMatcher(window.SlangDictionaryRO);

  let config = Object.assign({}, DEFAULTS);
  let rewriter = null;
  let observer = null;
  let scheduled = false;
  const pending = [];

  function ensureRewriter() {
    if (!rewriter) {
      rewriter = window.SlangDomRewrite.createRewriter({
        document: document,
        matcher: matcher,
        strictness: config.strictness,
        showOriginal: config.showOriginal
      });
    }
    return rewriter;
  }

  // ---------------------------------------------------------------- scheduling

  function enqueue(node) {
    pending.push(node);
    if (scheduled) return;
    scheduled = true;
    const defer = window.requestIdleCallback || function (fn) { return setTimeout(fn, 32); };
    defer(flush, { timeout: 500 });
  }

  /**
   * Detach the observer while rewriting so our own DOM edits do not feed back
   * into the queue.
   */
  function flush() {
    scheduled = false;
    if (!config.enabled) {
      pending.length = 0;
      return;
    }
    const roots = pending.splice(0, pending.length);
    if (!roots.length) return;

    stopObserving();
    let swapped = 0;
    roots.forEach(function (node) {
      if (node.isConnected !== false) swapped += ensureRewriter().rewrite(node);
    });
    startObserving();

    if (swapped) pushCount();
    if (pending.length) enqueue(pending.shift());
  }

  // ---------------------------------------------------------------- observing

  function startObserving() {
    if (observer || !document.body) return;
    observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === 'childList') {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType === 1 || node.nodeType === 3) enqueue(node);
          });
        } else if (record.type === 'characterData' && record.target.parentNode) {
          enqueue(record.target.parentNode);
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function stopObserving() {
    if (!observer) return;
    observer.disconnect();
    observer = null;
  }

  // ---------------------------------------------------------------- plumbing

  function pushCount() {
    try {
      chrome.runtime.sendMessage({ type: 'slang:count', count: ensureRewriter().stats.count });
    } catch (err) {
      // The extension context goes away on reload; nothing to do about it.
    }
  }

  function applyMarks() {
    document.documentElement.classList.toggle('slang-marks', !!config.showOriginal);
  }

  function start() {
    applyMarks();
    if (!config.enabled) return;
    startObserving();
    enqueue(document.body);
  }

  chrome.storage.sync.get(DEFAULTS, function (stored) {
    config = Object.assign({}, DEFAULTS, stored);
    if (document.body) {
      start();
    } else {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    }
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'sync') return;
    let touched = false;
    Object.keys(changes).forEach(function (key) {
      if (!(key in DEFAULTS)) return;
      config[key] = changes[key].newValue;
      touched = true;
    });
    if (!touched) return;

    // Strictness and marks both change what the page should look like, so the
    // simplest correct thing is to undo everything and rewrite from scratch.
    stopObserving();
    if (rewriter) {
      rewriter.undoAll();
      rewriter.setOptions(config);
    }
    pushCount();
    applyMarks();
    if (config.enabled) start();
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || message.type !== 'slang:stats') return false;
    const active = ensureRewriter();
    sendResponse({
      ok: true,
      count: active.stats.count,
      top: active.topEntries(6),
      dictionary: { entries: matcher.entryCount, patterns: matcher.patternCount }
    });
    return false;
  });
})();
