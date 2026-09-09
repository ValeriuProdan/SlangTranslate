/**
 * The tiny pattern language used by the dictionary.
 *
 *   "follow up"                 plain sequence of words
 *   "?just checking in"         leading "?" marks an OPTIONAL token
 *   "(lets|let us) sync"        parentheses give ALTERNATIVES for one slot
 *   "?(i|we) ?(will|ll) follow up"
 *
 * One line of DSL therefore covers "I will follow up", "we'll follow up",
 * "follow up" and "I follow-up" without listing them by hand.
 *
 * Alternatives are single tokens; write a second pattern for a multi-word
 * variant.
 */
(function (root) {
  'use strict';

  const N = root.SlangNormalize || (typeof require === 'function' ? require('./normalize.js') : null);

  function parseSlot(part) {
    let optional = false;
    let body = part;
    if (body.charAt(0) === '?') {
      optional = true;
      body = body.slice(1);
    }
    // Alternatives are one token each; a space inside the parentheses
    // would have been split away above, so catch it loudly here.
    if (body.indexOf('(') !== -1 || body.indexOf(')') !== -1) {
      if (body.charAt(0) !== '(' || body.charAt(body.length - 1) !== ')') {
        throw new Error('Malformed alternatives (spaces inside parentheses?): ' + part);
      }
    }
    let raw;
    if (body.charAt(0) === '(' && body.charAt(body.length - 1) === ')') {
      raw = body.slice(1, -1).split('|');
    } else {
      raw = [body];
    }
    const alts = raw.map(function (word) {
      const norm = N.normalizeWord(word).replace(/[^\p{L}\p{N}]/gu, '');
      return { norm: norm, stem: N.stem(norm) };
    }).filter(function (alt) {
      return alt.norm.length > 0;
    });
    return { optional: optional, alts: alts };
  }

  /**
   * @param {string} source pattern text
   * @returns {{source:string, slots:Array, required:number, firstChars:string[]}}
   */
  function parsePattern(source) {
    const slots = String(source).trim().split(/\s+/).map(parseSlot).filter(function (slot) {
      return slot.alts.length > 0;
    });
    if (!slots.length) throw new Error('Empty pattern: ' + source);

    const required = slots.filter(function (s) { return !s.optional; }).length;
    if (required === 0) throw new Error('Pattern needs at least one required token: ' + source);

    return {
      source: source,
      slots: slots,
      required: required,
      firstChars: leadingChars(slots)
    };
  }

  /**
   * Every first letter a match could start on. Optional leading slots mean a
   * match may begin at the first, second, ... slot, so all of them are
   * indexed. This is what keeps lookup cheap: a page token is only ever
   * compared against patterns filed under its own first letter.
   */
  function leadingChars(slots) {
    const chars = new Set();
    for (let i = 0; i < slots.length; i++) {
      slots[i].alts.forEach(function (alt) { chars.add(alt.norm.charAt(0)); });
      if (!slots[i].optional) break;
    }
    return Array.from(chars);
  }

  const api = { parsePattern: parsePattern, parseSlot: parseSlot };

  root.SlangPattern = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
