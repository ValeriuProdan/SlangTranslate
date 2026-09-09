/**
 * The DOM half of the extension: find text worth rewriting, swap it, and be
 * able to put everything back.
 *
 * Deliberately free of any chrome.* API so it can run in a plain page (see
 * demo/index.html) and be exercised without loading the extension.
 *
 * Rules of the road:
 *  - never touch what the user is typing into (compose boxes, inputs)
 *  - every rewrite is wrapped in a span carrying both texts, so it can be
 *    flipped back and forth on click and undone wholesale
 *  - the language is decided per passage, not per page, so a Romanian reply
 *    under an English thread gets Romanian slang
 */
(function (root) {
  'use strict';

  const N = root.SlangNormalize || (typeof require === 'function' ? require('./normalize.js') : null);

  const CLASS = 'slang-swap';
  const ORIGINAL_CLASS = 'slang-original';

  // How much text the detector wants before it will commit to an answer, and
  // how far up the tree we will climb looking for it.
  const CONTEXT_CHARS = 400;
  const CONTEXT_ENOUGH = 60;
  const CONTEXT_DEPTH = 6;
  const PAGE_SAMPLE_CHARS = 2000;

  // One delegated listener per document, however many spans there are.
  const listening = new WeakSet();

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

  /**
   * Flip one span between the rewritten phrase and what was really written.
   * Both texts live on the element, so this needs no matcher and no memory
   * of how the phrase was produced.
   */
  function toggleSwap(span) {
    const original = span.getAttribute('data-slang-original');
    const replacement = span.getAttribute('data-slang-replacement');
    if (original === null || replacement === null) return false;
    const showingOriginal = span.classList.contains(ORIGINAL_CLASS);
    span.textContent = showingOriginal ? replacement : original;
    span.classList.toggle(ORIGINAL_CLASS, !showingOriginal);
    return true;
  }

  /**
   * Click a rewritten phrase to see the corporate original, click again to
   * put the slang back.
   *
   * Listens on the capture phase so a mail client that swallows clicks does
   * not swallow this one, but deliberately does NOT preventDefault or stop
   * propagation: the host app owns this click too -- opening a message from
   * the list, following a link -- and breaking that would be far worse than
   * a stray toggle.
   */
  function attachToggle(doc) {
    if (listening.has(doc)) return;
    listening.add(doc);
    doc.addEventListener('click', function (event) {
      const target = event.target;
      if (!target || !target.closest) return;
      const span = target.closest('span.' + CLASS);
      if (!span) return;
      // A click that finishes a drag-selection is not a click on the phrase.
      const view = doc.defaultView;
      const selection = view && view.getSelection && view.getSelection();
      if (selection && !selection.isCollapsed) return;
      toggleSwap(span);
    }, true);
  }

  /**
   * Puts every swapped phrase back, anywhere in the document. Needs no
   * rewriter instance: the original text rides along on each span, so undo
   * works even after the language (and matcher) has been thrown away, and
   * whichever way a span is currently flipped.
   */
  function undoAll(doc, scope) {
    const spans = (scope || doc).querySelectorAll('span.' + CLASS);
    Array.prototype.forEach.call(spans, function (span) {
      const parent = span.parentNode;
      if (!parent) return;
      parent.replaceChild(doc.createTextNode(span.getAttribute('data-slang-original')), span);
      parent.normalize();
    });
    return spans.length;
  }

  function SlangMatcherRef() {
    return root.SlangMatcher || (typeof require === 'function' ? require('./matcher.js') : null);
  }

  function createRewriter(options) {
    const doc = options.document;
    const matcher = options.matcher;
    const config = {
      strictness: options.strictness || 'normal',
      // 'auto', or a pack id to force. Falls back to this pack whenever the
      // text is too short or too mixed to call.
      language: options.language || 'auto',
      fallback: options.fallback || 'ro'
    };
    const packs = options.packs || null;
    const detector = options.detect || null;
    let pageLanguage;
    const stats = { count: 0, byEntry: new Map(), byLanguage: {} };
    // Per-entry occurrence counters, so variants rotate across the page.
    let seen = {};

    function setOptions(next) {
      if (next.strictness) config.strictness = next.strictness;
      if (next.language) config.language = next.language;
      if (next.fallback) config.fallback = next.fallback;
      // The page may well be a different email than last time we looked.
      pageLanguage = undefined;
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

    /**
     * Text under `el`, skipping anything we have already rewritten. Without
     * that exclusion the detector would read its own Romanian output back and
     * talk itself into Romanian.
     */
    function contextText(el, limit) {
      if (!el) return '';
      const parts = [];
      let length = 0;
      const walker = doc.createTreeWalker(el, 1 | 4, {
        acceptNode: function (candidate) {
          if (candidate.nodeType === 1) {
            if (isSkippable(candidate)) return 2;                      // REJECT
            if (candidate.classList && candidate.classList.contains(CLASS)) return 2;
            return 3;                                                  // SKIP
          }
          return 1;                                                    // ACCEPT
        }
      });
      let current;
      while ((current = walker.nextNode()) && length < limit) {
        const value = current.nodeValue;
        if (!value) continue;
        parts.push(value);
        length += value.length;
      }
      return parts.join(' ');
    }

    /** Climb until there is enough text around the node to judge it by. */
    function surroundingText(node) {
      let el = node.parentNode;
      for (let depth = 0; el && el.nodeType === 1 && depth < CONTEXT_DEPTH; depth++) {
        const text = contextText(el, CONTEXT_CHARS);
        if (text.length >= CONTEXT_ENOUGH) return text;
        if (el === doc.body) break;
        el = el.parentNode;
      }
      return '';
    }

    /**
     * Narrowest evidence first: the sentence itself, then the passage around
     * it, then the page. Only if all three shrug do we fall back to the
     * configured language.
     */
    function languageFor(node, text, matches) {
      if (config.language !== 'auto') return config.language;
      if (!detector) return config.fallback;

      // English corporate speak is borrowed by everyone, so counting the
      // "as per my last email" inside a Romanian sentence would wrongly vote
      // English. A phrase sourced in any other language is the opposite --
      // nobody writes "raman la dispozitia dumneavoastra" in an English
      // thread -- so those are left in as evidence.
      const ranges = matches
        .filter(function (match) { return (match.entry.src || 'en') === 'en'; })
        .map(function (match) { return [match.start, match.end]; });

      let guess = detector.detect(text, ranges);
      if (guess) return guess.id;

      guess = detector.detect(surroundingText(node));
      if (guess) return guess.id;

      if (pageLanguage === undefined) {
        const sample = detector.detect(contextText(doc.body, PAGE_SAMPLE_CHARS));
        pageLanguage = sample ? sample.id : null;
      }
      return pageLanguage || config.fallback;
    }

    function rewriteTextNode(node) {
      const text = node.nodeValue;
      if (!text || text.length < 3) return 0;
      if (!/[\p{L}]/u.test(text)) return 0;
      if (N.looksLikeMachineText(text)) return 0;

      const parent = node.parentNode;
      if (!parent) return 0;
      if (parent.classList && parent.classList.contains(CLASS)) return 0;

      let matches = matcher.findMatches(text, { strictness: config.strictness });
      if (!matches.length) return 0;

      const language = languageFor(node, text, matches);
      if (packs) {
        matches = SlangMatcherRef().relabel(text, matches, function (entryId, original, form) {
          const occurrence = seen[entryId] || 0;
          seen[entryId] = occurrence + 1;
          return packs.replacementFor(language, entryId, original, form, occurrence);
        });
        if (!matches.length) return 0;
      }

      const fragment = doc.createDocumentFragment();
      let cursor = 0;
      matches.forEach(function (match) {
        if (match.start > cursor) {
          fragment.appendChild(doc.createTextNode(text.slice(cursor, match.start)));
        }
        fragment.appendChild(makeSwap(match, language));
        cursor = match.end;
        record(match, language);
      });
      if (cursor < text.length) {
        fragment.appendChild(doc.createTextNode(text.slice(cursor)));
      }

      parent.replaceChild(fragment, node);
      return matches.length;
    }

    function makeSwap(match, language) {
      const span = doc.createElement('span');
      span.className = CLASS;
      span.textContent = match.replacement;
      span.setAttribute('data-slang-original', match.original);
      span.setAttribute('data-slang-replacement', match.replacement);
      span.setAttribute('data-slang-entry', match.entry.id);
      if (language) span.setAttribute('data-slang-lang', language);
      return span;
    }

    function record(match, language) {
      stats.count++;
      if (language) stats.byLanguage[language] = (stats.byLanguage[language] || 0) + 1;
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
    function undoAllHere(scope) {
      const restored = undoAll(doc, scope);
      stats.count = 0;
      stats.byEntry.clear();
      stats.byLanguage = {};
      seen = {};
      pageLanguage = undefined;
      return restored;
    }

    function topEntries(limit) {
      return Array.from(stats.byEntry.values())
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, limit || 6);
    }

    attachToggle(doc);

    return {
      rewrite: rewrite,
      undoAll: undoAllHere,
      setOptions: setOptions,
      topEntries: topEntries,
      stats: stats,
      CLASS: CLASS
    };
  }

  const api = {
    createRewriter: createRewriter,
    undoAll: undoAll,
    toggleSwap: toggleSwap,
    attachToggle: attachToggle,
    CLASS: CLASS,
    ORIGINAL_CLASS: ORIGINAL_CLASS
  };

  root.SlangDomRewrite = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
