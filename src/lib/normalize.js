/**
 * Text normalization, tokenization and casing helpers.
 *
 * Everything downstream compares *normalized* tokens: lowercased, stripped of
 * diacritics and apostrophes. That single rule already buys us a lot of
 * tolerance for free -- "let's" == "lets", "follow-up" == "follow up",
 * "F.Y.I." == "fyi" -- before any edit-distance work happens.
 */
(function (root) {
  'use strict';

  const APOSTROPHES = /['\u2019\u02bc`\u00b4]/g;
  const COMBINING = /[\u0300-\u036f]/g;

  // A token is a run of letters/digits, optionally glued by apostrophes so
  // "don't" stays one token instead of becoming "don" + "t".
  const TOKEN_RE = /[\p{L}\p{N}]+(?:['\u2019\u02bc][\p{L}\p{N}]+)*/gu;

  // A gap between two tokens ends the sentence if it holds a blank line or a
  // terminator followed by space. Two things deliberately do NOT count:
  // a bare "." (or "F.Y.I." would be torn apart) and a single newline,
  // which in HTML source is just wrapping and renders as a space.
  const HARD_BREAK_RE = /\n\s*\n|\r\s*\r|[\u2028\u2029]|[.!?\u2026]\s|[|\u2022\u00b7]/;

  function stripDiacritics(str) {
    return str.normalize('NFD').replace(COMBINING, '');
  }

  function normalizeWord(word) {
    return stripDiacritics(String(word).toLowerCase()).replace(APOSTROPHES, '');
  }

  /** Collapse an English word to a crude stem so verb forms match each other. */
  function stem(word) {
    const w = word;
    if (w.length <= 4) return w;
    if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.endsWith('ing')) return dedouble(w.slice(0, -3));
    if (w.endsWith('ed')) return dedouble(w.slice(0, -2));
    if (w.endsWith('ses') || w.endsWith('xes') || w.endsWith('ches') || w.endsWith('shes')) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
    return w;
  }

  // "stopp" -> "stop", but leave "call" / "pass" alone.
  function dedouble(w) {
    const n = w.length;
    if (n >= 3 && w[n - 1] === w[n - 2] && 'sfl'.indexOf(w[n - 1]) === -1) return w.slice(0, -1);
    return w;
  }

  function makeToken(raw, start, text, previous) {
    const norm = normalizeWord(raw);
    return {
      raw: raw,
      start: start,
      end: start + raw.length,
      norm: norm,
      stem: stem(norm),
      // True when this token cannot be joined to the previous one by a match.
      breakBefore: previous ? HARD_BREAK_RE.test(text.slice(previous.end, start)) : true
    };
  }

  function tokenize(text) {
    const tokens = [];
    let match;
    TOKEN_RE.lastIndex = 0;
    while ((match = TOKEN_RE.exec(text)) !== null) {
      tokens.push(makeToken(match[0], match.index, text, tokens[tokens.length - 1]));
    }
    return tokens;
  }

  /**
   * Re-dress a replacement in the casing of the text it replaces:
   * "Please Advise" -> "Zi si tu ceva", and a multi-word SHOUT stays a shout.
   * A single all-caps token is an acronym, not shouting, so it only gets a
   * capital first letter.
   */
  function isSentenceStart(text, index) {
    let i = index - 1;
    while (i >= 0) {
      const ch = text.charAt(i);
      if (ch === '\n' || ch === '\r') return true;
      if (!/\s/.test(ch)) break;
      i--;
    }
    if (i < 0) return true;
    return '.!?:;>*-\u2022'.indexOf(text.charAt(i)) !== -1;
  }

  function applyCase(original, replacement, sentenceStart) {
    const letters = original.replace(/[^\p{L}]/gu, '');
    if (!letters) return replacement;
    const isUpper = letters === letters.toUpperCase() && letters.length >= 2;
    const multiWord = /[\p{L}\p{N}]\s+[\p{L}\p{N}]/u.test(original.trim());
    if (isUpper && multiWord) return replacement.toUpperCase();
    if (sentenceStart !== false && /^[\p{Lu}]/u.test(original.trim())) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  }

  /** Cheap guard so we never rewrite the inside of a URL or an address. */
  function looksLikeMachineText(text) {
    return /https?:\/\/|\bwww\.|\S+@\S+\.\S+|<[a-z][^>]*>/i.test(text);
  }

  const api = {
    stripDiacritics: stripDiacritics,
    normalizeWord: normalizeWord,
    stem: stem,
    tokenize: tokenize,
    applyCase: applyCase,
    isSentenceStart: isSentenceStart,
    looksLikeMachineText: looksLikeMachineText,
    HARD_BREAK_RE: HARD_BREAK_RE
  };

  root.SlangNormalize = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
