/**
 * The DOM half of the extension: find text worth rewriting, swap it, and be
 * able to put everything back.
 *
 * Deliberately free of any chrome.* API so it can run in a plain page (see
 * demo/index.html) and be exercised without loading the extension.
 *
 * Rules of the road:
 *  - never touch what the user is typing into (compose boxes, inputs)
 *  - every rewrite is wrapped in a span carrying the original text, so the
 *    change is reversible and hoverable
 */
(function (root) {
  'use strict';

  const N = root.SlangNormalize || (typeof require === 'function' ? require('./normalize.js') : null);

  const CLASS = 'slang-swap';

  const SKIP_TAGS = {
    SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1,
    OPTION: 1, CODE: 1, PRE: 1, KBD: 1, SAMP: 1, IFRAME: 1
  };

  // Compose windows and rich-text editors, across the supported clients.
  const SKIP_SELECTOR = [
    '[contenteditable="true"]',
    '[g_editable="true"]',
    '[role="textbox"]',
    '[data-slang-skip]',
    '.editable',
    '.' + CLASS
  ].join(',');

  function createRewriter(options) {
    const doc = options.document;
    const matcher = options.matcher;
    const config = {
      strictness: options.strictness || 'normal',
      showOriginal: options.showOriginal !== false
    };
    const stats = { count: 0, byEntry: new Map() };

    function setOptions(next) {
      if (next.strictness) config.strictness = next.strictness;
      if ('showOriginal' in next) config.showOriginal = !!next.showOriginal;
    }

    function isSkippable(el) {
      if (SKIP_TAGS[el.tagName]) return true;
      if (el.isContentEditable) return true;
      try {
        return el.matches(SKIP_SELECTOR);
      } catch (err) {
        return false;
      }
    }

    function collectTextNodes(node) {
      if (node.nodeType === 3) return [node];
      if (node.nodeType !== 1) return [];
      if (isSkippable(node)) return [];

      const nodes = [];
      const walker = doc.createTreeWalker(node, 1 | 4, {
        acceptNode: function (candidate) {
          if (candidate.nodeType === 1) return isSkippable(candidate) ? 2 : 3; // REJECT : SKIP
          return 1; // ACCEPT
        }
      });
      let current;
      while ((current = walker.nextNode())) nodes.push(current);
      return nodes;
    }

    function rewriteTextNode(node) {
      const text = node.nodeValue;
      if (!text || text.length < 3) return 0;
      if (!/[\p{L}]/u.test(text)) return 0;
      if (N.looksLikeMachineText(text)) return 0;

      const parent = node.parentNode;
      if (!parent) return 0;
      if (parent.classList && parent.classList.contains(CLASS)) return 0;

      const matches = matcher.findMatches(text, { strictness: config.strictness });
      if (!matches.length) return 0;

      const fragment = doc.createDocumentFragment();
      let cursor = 0;
      matches.forEach(function (match) {
        if (match.start > cursor) {
          fragment.appendChild(doc.createTextNode(text.slice(cursor, match.start)));
        }
        fragment.appendChild(makeSwap(match));
        cursor = match.end;
        record(match);
      });
      if (cursor < text.length) {
        fragment.appendChild(doc.createTextNode(text.slice(cursor)));
      }

      parent.replaceChild(fragment, node);
      return matches.length;
    }

    function makeSwap(match) {
      const span = doc.createElement('span');
      span.className = CLASS;
      span.textContent = match.replacement;
      span.setAttribute('data-slang-original', match.original);
      span.setAttribute('data-slang-entry', match.entry.id);
      if (config.showOriginal) span.title = 'corporatese: ' + match.original;
      return span;
    }

    function record(match) {
      stats.count++;
      const seen = stats.byEntry.get(match.entry.id);
      if (seen) {
        seen.count++;
        return;
      }
      stats.byEntry.set(match.entry.id, {
        id: match.entry.id,
        original: match.original,
        replacement: match.replacement,
        count: 1
      });
    }

    /** @returns {number} how many phrases were swapped under `root`. */
    function rewrite(node) {
      if (!node) return 0;
      let swapped = 0;
      collectTextNodes(node).forEach(function (textNode) {
        if (textNode.parentNode) swapped += rewriteTextNode(textNode);
      });
      return swapped;
    }

    /** Puts every swapped phrase back and forgets the stats. */
    function undoAll(scope) {
      const spans = (scope || doc).querySelectorAll('span.' + CLASS);
      Array.prototype.forEach.call(spans, function (span) {
        const parent = span.parentNode;
        if (!parent) return;
        parent.replaceChild(doc.createTextNode(span.getAttribute('data-slang-original')), span);
        parent.normalize();
      });
      stats.count = 0;
      stats.byEntry.clear();
      return spans.length;
    }

    function topEntries(limit) {
      return Array.from(stats.byEntry.values())
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, limit || 6);
    }

    return {
      rewrite: rewrite,
      undoAll: undoAll,
      setOptions: setOptions,
      topEntries: topEntries,
      stats: stats,
      CLASS: CLASS
    };
  }

  const api = { createRewriter: createRewriter, CLASS: CLASS };

  root.SlangDomRewrite = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
