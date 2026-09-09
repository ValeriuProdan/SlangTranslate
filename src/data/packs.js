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
  const PHRASES = root.SlangPhrases || (req ? req('./phrases.js') : null);

  const registry = new Map();
  const DEFAULT_ID = 'ro';

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
          const out = pack.out[phrase.id];
          return out && out.length;
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
      const out = pack.out[phrase.id];
      if (!out || !out.length) return;
      entries.push({ id: phrase.id, p: phrase.p, out: out });
    });
    return {
      id: pack.id,
      label: pack.label,
      nativeLabel: pack.nativeLabel,
      entries: entries
    };
  }

  const api = {
    build: build,
    get: get,
    list: list,
    register: register,
    DEFAULT_ID: DEFAULT_ID,
    phraseCount: PHRASES.entries.length
  };

  root.SlangPacks = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
