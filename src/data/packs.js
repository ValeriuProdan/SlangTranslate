/**
 * Registry that combines the shared phrase list with one language's
 * replacements to produce a dictionary the matcher can compile.
 *
 * Adding a language is a new slang-XX.js plus one register() call here; the
 * patterns in phrases.js are shared, so nothing else changes.
 */
(function (root) {
  'use strict';

  const req = typeof require === 'function' ? require : null;
  // Two source lists: English corporate speak, which turns up in everyone's
  // email, and Romanian corporate speak, which does not.
  const EN_PHRASES = root.SlangPhrases || (req ? req('./phrases.js') : null);
  const RO_PHRASES = root.SlangPhrasesRO || (req ? req('./phrases-ro.js') : null);

  const PHRASES = { entries: [] };
  [EN_PHRASES, RO_PHRASES].forEach(function (list) {
    if (!list) return;
    list.entries.forEach(function (entry) {
      PHRASES.entries.push({ id: entry.id, p: entry.p, src: list.src || 'en' });
    });
  });

  const registry = new Map();
  const DEFAULT_ID = 'ro';

  // Not a pack: the instruction to work the language out from the text.
  const AUTO = 'auto';

  function register(pack) {
    if (pack && pack.id) registry.set(pack.id, pack);
  }

  register(root.SlangPackRO || (req ? req('./slang-ro.js') : null));
  register(root.SlangPackEN || (req ? req('./slang-en.js') : null));

  function get(id) {
    return registry.get(id) || registry.get(DEFAULT_ID);
  }

  /** Language options for the popup, with how many phrases each covers. */
  function list() {
    return Array.from(registry.values()).map(function (pack) {
      return {
        id: pack.id,
        label: pack.label,
        nativeLabel: pack.nativeLabel,
        coverage: PHRASES.entries.filter(function (phrase) {
          return covers(pack.id, phrase.id);
        }).length
      };
    });
  }

  /**
   * @param {string} id language id, falling back to the default
   * @returns {{id:string, label:string, entries:Array}} ready for
   *          SlangMatcher.createMatcher. Phrases the pack has no words for
   *          are simply left out, so a partial pack is valid.
   */
  function build(id) {
    const pack = get(id);
    const entries = [];
    PHRASES.entries.forEach(function (phrase) {
      if (!covers(pack.id, phrase.id)) return;
      entries.push({ id: phrase.id, p: phrase.p, src: phrase.src, out: pack.out[phrase.id] });
    });
    return {
      id: pack.id,
      label: pack.label,
      nativeLabel: pack.nativeLabel,
      entries: entries
    };
  }

  /**
   * The replacement one language would use for one phrase, chosen the same
   * deterministic way build() would have chosen it. This is what lets the
   * language be decided per sentence instead of per page.
   */
  /**
   * @param {number} [occurrence] how many times this phrase has already been
   *        rewritten on the page. When given, variants rotate in page order --
   *        so two "park this" a sentence apart get two different jokes, and a
   *        re-render walks the page in the same order and lands on the same
   *        ones. Without it the pick hashes the text, which is stable but lets
   *        identical phrases collide.
   */
  function replacementFor(packId, entryId, original, form, occurrence) {
    // Resolved on use, not on load: the popup loads the packs without the
    // matcher and never asks for a replacement.
    const M = root.SlangMatcher || (req ? req('../lib/matcher.js') : null);
    if (!M) return '';
    const outputs = M.formOf(get(packId).out[entryId], form || 'base');
    if (!outputs.length) return '';
    if (typeof occurrence === 'number') return outputs[occurrence % outputs.length];
    return M.pickVariant(outputs, entryId + '|' + String(original).toLowerCase());
  }

  /** Does this pack have any words at all for the phrase? */
  function covers(packId, entryId) {
    const value = get(packId).out[entryId];
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    return !!(value.base && value.base.length);
  }

  const api = {
    phrases: PHRASES,
    build: build,
    replacementFor: replacementFor,
    covers: covers,
    AUTO: AUTO,
    get: get,
    list: list,
    register: register,
    DEFAULT_ID: DEFAULT_ID,
    phraseCount: PHRASES.entries.length
  };

  root.SlangPacks = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
