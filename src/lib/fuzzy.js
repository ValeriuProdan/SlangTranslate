/**
 * Bounded Damerau-Levenshtein distance and the token-level scoring rules.
 *
 * Typo tolerance has to scale with word length. One edit inside "bandwidth"
 * is obviously a typo; one edit inside "sync" turns it into "sink", a
 * different word. So short tokens demand an exact match and only longer ones
 * get a budget.
 */
(function (root) {
  'use strict';

  /**
   * Edit distance with transpositions, giving up as soon as it provably
   * exceeds `max` (returns max + 1 in that case).
   */
  function editDistance(a, b, max) {
    if (a === b) return 0;
    const la = a.length;
    const lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    if (la === 0) return lb;
    if (lb === 0) return la;

    let prev2 = null;
    let prev = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) prev[j] = j;

    for (let i = 1; i <= la; i++) {
      const cur = new Array(lb + 1);
      cur[0] = i;
      let rowMin = i;
      for (let j = 1; j <= lb; j++) {
        const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (i > 1 && j > 1 &&
            a.charCodeAt(i - 1) === b.charCodeAt(j - 2) &&
            a.charCodeAt(i - 2) === b.charCodeAt(j - 1)) {
          v = Math.min(v, prev2[j - 2] + 1);
        }
        cur[j] = v;
        if (v < rowMin) rowMin = v;
      }
      if (rowMin > max) return max + 1;
      prev2 = prev;
      prev = cur;
    }
    return prev[lb];
  }

  /** How many edits a token of this length is allowed to absorb. */
  function budgetFor(len) {
    if (len <= 3) return 0;
    if (len <= 6) return 1;
    if (len <= 10) return 2;
    return 3;
  }

  /**
   * Score two tokens in [0, 1]. 0 means "not the same word".
   * `a` comes from the page, `b` from a dictionary pattern.
   */
  function tokenScore(a, b, cfg) {
    if (a.norm === b.norm) return 1;
    if (cfg.exact) return 0;
    if (a.stem.length >= 3 && a.stem === b.stem) return 0.93;

    const maxLen = Math.max(a.norm.length, b.norm.length);
    const budget = Math.min(cfg.maxTypos, budgetFor(maxLen));
    if (budget === 0) return 0;

    let d = editDistance(a.norm, b.norm, budget);
    let over = maxLen;

    // "moving" vs "move" is 3 edits raw but 1 between stems. Bridging stems
    // like that is only safe inside a multi-word phrase, where the other
    // words vouch for the match: on its own, "ideas" is one stem-edit from
    // "ideating" and simply a different word.
    if (d > budget && cfg.stemBridge !== false && (a.stem !== a.norm || b.stem !== b.norm)) {
      const stemLen = Math.max(a.stem.length, b.stem.length);
      const stemBudget = Math.min(cfg.maxTypos, budgetFor(stemLen));
      const ds = editDistance(a.stem, b.stem, stemBudget);
      if (ds <= stemBudget && ds < d) {
        d = ds;
        // Score against the stems that were actually compared, not the
        // longer words -- otherwise one edit in "idea" reads as 1/8.
        over = stemLen;
      }
    }
    if (d > budget) return 0;

    const score = 1 - d / over;
    return score >= cfg.minTokenScore ? score : 0;
  }

  const api = {
    editDistance: editDistance,
    budgetFor: budgetFor,
    tokenScore: tokenScore
  };

  root.SlangFuzzy = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
