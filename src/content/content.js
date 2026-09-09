/**
 * Extension glue: reads settings, drives the rewriter over the mail UI, and
 * keeps rewriting as the client swaps content in.
 *
 * The matching lives in src/lib/, the DOM work in src/lib/dom-rewrite.js.
 * Everything here is local to the tab; nothing is ever sent anywhere.
 */
(function () {
  'use strict';

  const DEFAULTS = {
    enabled: true,
    language: window.SlangPacks.AUTO,
    strictness: 'normal',
    highlight: true
  };

  const LOCAL_DEFAULTS = { pausedUntil: 0 };

  let config = Object.assign({}, DEFAULTS);
  let pausedUntil = 0;
  let resumeTimer = null;
  let matcher = null;
  let rewriter = null;
  let observer = null;
  let scheduled = false;
  const pending = [];

  /**
    * Built once and never rebuilt: every pack shares the same patterns, so the
    * language only changes which words come out, never what gets matched.
    */
  function ensureMatcher() {
    if (!matcher) {
      matcher = window.SlangMatcher.createMatcher(
        window.SlangPacks.build(window.SlangPacks.DEFAULT_ID));
    }
    return matcher;
  }

  function ensureRewriter() {
    if (!rewriter) {
      rewriter = window.SlangDomRewrite.createRewriter({
        document: document,
        matcher: ensureMatcher(),
        strictness: config.strictness,
        language: config.language,
        fallback: window.SlangPacks.DEFAULT_ID,
        packs: window.SlangPacks,
        detect: window.SlangDetect
      });
    }
    return rewriter;
  }

  function isPaused() {
    return window.SlangPause.isPaused(pausedUntil, Date.now());
  }

  /** Switched on and not snoozed. */
  function active() {
    return config.enabled && !isPaused();
  }

  /**
   * Wake up when the pause expires and put the page back. Nothing else
   * would notice: no alarm, no polling, and a tab opened after expiry is
   * simply not paused.
   */
  function scheduleResume() {
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
    const left = window.SlangPause.remaining(pausedUntil, Date.now());
    if (!left) return;
    resumeTimer = setTimeout(function () {
      resumeTimer = null;
      refresh();
    }, left + 250);
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
    if (!active()) {
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

    if (swapped) pushState();
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

  function pushState() {
    try {
      chrome.runtime.sendMessage({
        type: 'slang:count',
        count: ensureRewriter().stats.count,
        paused: isPaused(),
        pausedUntil: pausedUntil
      });
    } catch (err) {
      // The extension context goes away on reload; nothing to do about it.
    }
  }

  function applyMarks() {
    document.documentElement.classList.toggle('slang-marks', !!config.highlight);
  }

  function start() {
    applyMarks();
    if (!active()) return;
    startObserving();
    enqueue(document.body);
  }

  /**
   * Undo everything and rewrite from scratch. Language, strictness, marks
   * and pause all change what the page should look like, and this is the
   * simplest thing that is correct for all of them.
   */
  function refresh() {
    stopObserving();
    if (rewriter) {
      rewriter.undoAll();
      rewriter.setOptions(config);
    } else {
      // The rewriter went away with the old language; the spans still know
      // their originals, so undo needs nothing else.
      window.SlangDomRewrite.undoAll(document);
    }
    pushState();
    applyMarks();
    if (active()) start();
  }

  chrome.storage.sync.get(DEFAULTS, function (stored) {
    config = Object.assign({}, DEFAULTS, stored);
    chrome.storage.local.get(LOCAL_DEFAULTS, function (local) {
      pausedUntil = local.pausedUntil || 0;
      scheduleResume();
      if (document.body) {
        start();
      } else {
        document.addEventListener('DOMContentLoaded', start, { once: true });
      }
    });
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local') {
      if (!changes.pausedUntil) return;
      pausedUntil = changes.pausedUntil.newValue || 0;
      scheduleResume();
      refresh();
      return;
    }
    if (area !== 'sync') return;
    let touched = false;
    Object.keys(changes).forEach(function (key) {
      if (!(key in DEFAULTS)) return;
      config[key] = changes[key].newValue;
      touched = true;
    });
    if (touched) refresh();
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || message.type !== 'slang:stats') return false;
    const current = ensureRewriter();
    sendResponse({
      ok: true,
      count: current.stats.count,
      top: current.topEntries(6),
      byLanguage: current.stats.byLanguage,
      paused: isPaused(),
      pausedUntil: pausedUntil,
      language: config.language,
      languages: window.SlangPacks.list(),
      dictionary: {
        entries: ensureMatcher().entryCount,
        patterns: ensureMatcher().patternCount
      }
    });
    return false;
  });
})();
