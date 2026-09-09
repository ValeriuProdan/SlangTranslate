/**
 * Which language is this text actually written in?
 *
 * The corporate phrases we hunt are always English, so the phrase itself says
 * nothing about the writer. What matters is the language of the text around
 * it -- the carrier language -- because that is the language the joke should
 * land in.
 *
 * This is deliberately a function-word counter rather than anything cleverer,
 * because that is exactly what "romgleza" needs. Romanians borrow English
 * *content* words -- deploy, blocker, feature, meeting -- while the grammar
 * holding the sentence together stays stubbornly Romanian. Counting the glue
 * words ("am facut deploy la feature-ul ala") gets it right where counting
 * vocabulary would not.
 *
 * Returns null rather than guessing when there is too little to go on; the
 * caller is expected to widen the context and ask again.
 */
(function (root) {
  'use strict';

  const N = root.SlangNormalize || (typeof require === 'function' ? require('./normalize.js') : null);

  // Letters that only Romanian uses, in both the correct comma-below forms
  // and the cedilla lookalikes people's keyboards still produce.
  const DIACRITICS = /[ăâîșțşţĂÂÎȘȚŞŢ]/g;

  // Words are stored normalized (lowercased, diacritics stripped), because
  // that is how they arrive from the tokenizer: "si", not "..i".
  //
  // Anything that exists in both languages is left out on purpose -- "in"
  // (ro: "in"), "are", "am", "care", "a", "o", "e" and "ai" are all traps.
  const ROMANIAN = words(`
    si sa sau ori de la cu ce nu ne va le il isi lui ei ele noi voi te tie mie imi
    este sunt pentru din dar daca cand cum foarte acum tot toate toata bine
    avem aveti aveam facut face fac faci facem zice zic zici spune spun stiu stii stie
    trebuie poate pot poti vreau vrei vrea vrem mult multe putin mare mic
    asta astea aia ala aia aici acolo asa deja doar inca pana dupa intre fara prin
    despre catre niste ceva nimic cineva nimeni unde cine deci totusi adica oricum
    chiar mai insa atunci mereu niciodata iar cam cat cati cate ale alta alte altul
    unul una fiecare orice oricare pe sub peste lor nostru noastra vostru meu mea tau ta
    dumneavoastra multumesc salut buna ziua rog
  `);

  const ENGLISH = words(`
    the and of to is was were be been being have has had will would should could can
    this that these those with from for but not you your yours we our ours they their
    it its he she his her him them us my me mine i do does did done no yes just about
    into onto over under after before between without through during again more most
    very also only even still because while until since each other such same too
    at by on as if or so than then there here what which who whom when where why how
    all any some both few many much every another else please thanks thank
  `);

  // Endings that are Romanian give-aways even in words the list has never seen.
  const ROMANIAN_ENDINGS = [
    'ului', 'ilor', 'elor', 'urile', 'urilor', 'eaza', 'esti', 'easca', 'atia', 'atie'
  ];

  const WEIGHT_WORD = 2;
  const WEIGHT_ENDING = 1;
  const WEIGHT_DIACRITIC = 2;
  const MAX_DIACRITICS_COUNTED = 4;

  // Below these, say nothing rather than guess.
  const MIN_SIGNAL = 4;
  const MIN_CONFIDENCE = 0.25;

  function words(block) {
    const set = new Set();
    block.split(/\s+/).forEach(function (word) {
      if (word) set.add(word);
    });
    return set;
  }

  function hasRomanianEnding(word) {
    if (word.length < 5) return false;
    for (let i = 0; i < ROMANIAN_ENDINGS.length; i++) {
      if (word.endsWith(ROMANIAN_ENDINGS[i])) return true;
    }
    return false;
  }

  function inAnyRange(token, ranges) {
    for (let i = 0; i < ranges.length; i++) {
      if (token.start >= ranges[i][0] && token.end <= ranges[i][1]) return true;
    }
    return false;
  }

  /**
   * @param {string} text
   * @param {Array<[number,number]>} [exclude] character ranges to ignore --
   *        pass the corporate phrases already found, or their English function
   *        words ("as per my last email") will vote for English.
   * @returns {{id:string, confidence:number, ro:number, en:number}|null}
   */
  function detect(text, exclude) {
    if (!text) return null;
    const ranges = exclude || [];
    const tokens = N.tokenize(text);

    let ro = 0;
    let en = 0;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (ranges.length && inAnyRange(token, ranges)) continue;
      const word = token.norm;
      if (ROMANIAN.has(word)) ro += WEIGHT_WORD;
      else if (ENGLISH.has(word)) en += WEIGHT_WORD;
      else if (hasRomanianEnding(word)) ro += WEIGHT_ENDING;
    }

    // Diacritics are near-proof, but cap them so one accented word cannot
    // outvote a whole English paragraph.
    const accents = (text.match(DIACRITICS) || []).length;
    if (accents) ro += Math.min(accents, MAX_DIACRITICS_COUNTED) * WEIGHT_DIACRITIC;

    const total = ro + en;
    if (total < MIN_SIGNAL) return null;

    const confidence = Math.abs(ro - en) / total;
    if (confidence < MIN_CONFIDENCE) return null;

    return { id: ro > en ? 'ro' : 'en', confidence: confidence, ro: ro, en: en };
  }

  const api = {
    detect: detect,
    MIN_SIGNAL: MIN_SIGNAL,
    MIN_CONFIDENCE: MIN_CONFIDENCE
  };

  root.SlangDetect = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
