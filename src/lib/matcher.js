/**
 * Turns a dictionary into something that can scan text fast.
 *
 * Patterns are filed under every letter a match could start with, so scanning
 * a token only compares it against the handful of patterns beginning with the
 * same letter -- not the whole dictionary.
 *
 * Selection is greedy left-to-right, preferring the longest match at a given
 * position, then the best-scoring one. Matches never overlap.
 */
(function (root) {
  'use strict';

  const req = typeof require === 'function' ? require : null;
  const N = root.SlangNormalize || (req ? req('./normalize.js') : null);
  const F = root.SlangFuzzy || (req ? req('./fuzzy.js') : null);
  const P = root.SlangPattern || (req ? req('./pattern.js') : null);

  const PRESETS = {
    strict: { maxTypos: 1, minTokenScore: 0.86, minPhraseScore: 0.93, minSingleScore: 0.99 },
    normal: { maxTypos: 2, minTokenScore: 0.70, minPhraseScore: 0.82, minSingleScore: 0.85 },
    loose:  { maxTypos: 3, minTokenScore: 0.60, minPhraseScore: 0.72, minSingleScore: 0.80 }
  };

  function configFor(strictness) {
    return PRESETS[strictness] || PRESETS.normal;
  }

  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function createMatcher(dictionary) {
    const index = new Map();
    const compiled = [];

    dictionary.entries.forEach(function (entry) {
      entry.p.forEach(function (source) {
        const pattern = P.parsePattern(source);
        const item = { entry: entry, pattern: pattern };
        compiled.push(item);
        pattern.firstChars.forEach(function (ch) {
          if (!index.has(ch)) index.set(ch, []);
          index.get(ch).push(item);
        });
      });
    });

    // Longer patterns first so the common case finds the best match early.
    index.forEach(function (list) {
      list.sort(function (a, b) { return b.pattern.slots.length - a.pattern.slots.length; });
    });

    /**
     * Try one pattern at one token position.
     * Walks the slots, either consuming a token or skipping an optional slot,
     * and keeps whichever branch consumes the most tokens.
     */
    function matchPattern(tokens, start, pattern, cfg) {
      const slots = pattern.slots;

      function walk(si, ti) {
        if (si === slots.length) return { ti: ti, sum: 0, weight: 0, consumed: 0 };
        const slot = slots[si];
        let best = null;

        // Branch 1: consume the current token with this slot.
        const canConsume = ti < tokens.length && (ti === start || !tokens[ti].breakBefore);
        if (canConsume) {
          let bestScore = 0;
          let bestWeight = 0;
          for (let a = 0; a < slot.alts.length; a++) {
            const score = F.tokenScore(tokens[ti], slot.alts[a], cfg);
            if (score > bestScore) {
              bestScore = score;
              bestWeight = Math.max(2, slot.alts[a].norm.length);
            }
          }
          if (bestScore > 0) {
            const rest = walk(si + 1, ti + 1);
            if (rest) {
              best = {
                ti: rest.ti,
                sum: rest.sum + bestScore * bestWeight,
                weight: rest.weight + bestWeight,
                consumed: rest.consumed + 1
              };
            }
          }
        }

        // Branch 2: skip this slot, only allowed when it is optional.
        if (slot.optional) {
          const rest = walk(si + 1, ti);
          if (rest && (!best || rest.consumed > best.consumed)) best = rest;
        }

        return best;
      }

      const result = walk(0, start);
      if (!result || result.consumed === 0 || result.weight === 0) return null;

      const score = result.sum / result.weight;
      const floor = result.consumed === 1 ? cfg.minSingleScore : cfg.minPhraseScore;
      if (score < floor) return null;

      return { endToken: result.ti, consumed: result.consumed, score: score };
    }

    function bestAt(tokens, i, cfg) {
      const candidates = index.get(tokens[i].norm.charAt(0));
      if (!candidates) return null;
      let best = null;
      for (let c = 0; c < candidates.length; c++) {
        const hit = matchPattern(tokens, i, candidates[c].pattern, cfg);
        if (!hit) continue;
        if (!best || hit.consumed > best.consumed ||
            (hit.consumed === best.consumed && hit.score > best.score)) {
          best = {
            endToken: hit.endToken,
            consumed: hit.consumed,
            score: hit.score,
            entry: candidates[c].entry,
            pattern: candidates[c].pattern
          };
        }
      }
      return best;
    }

    /**
     * @returns {Array<{start:number,end:number,original:string,replacement:string,entry:object,score:number}>}
     *          character offsets into `text`, in order, non-overlapping.
     */
    function findMatches(text, options) {
      const opts = options || {};
      const cfg = configFor(opts.strictness);
      const tokens = N.tokenize(text);
      const matches = [];

      let i = 0;
      while (i < tokens.length) {
        const best = bestAt(tokens, i, cfg);
        if (!best) {
          i++;
          continue;
        }
        const from = tokens[i].start;
        const to = tokens[best.endToken - 1].end;
        const original = text.slice(from, to);
        matches.push({
          start: from,
          end: to,
          original: original,
          replacement: N.applyCase(original, pickOutput(best.entry, original),
            N.isSentenceStart(text, from)),
          entry: best.entry,
          score: best.score
        });
        i = best.endToken;
      }
      return matches;
    }

    /**
     * Pick one of the entry's variants deterministically, so re-rendering the
     * same email never reshuffles the joke.
     */
    function pickOutput(entry, original) {
      const outputs = entry.ro;
      if (outputs.length === 1) return outputs[0];
      return outputs[fnv1a(entry.id + '|' + N.normalizeWord(original)) % outputs.length];
    }

    /** Convenience for tests and for the popup preview. */
    function translate(text, options) {
      const matches = findMatches(text, options);
      let out = '';
      let cursor = 0;
      matches.forEach(function (m) {
        out += text.slice(cursor, m.start) + m.replacement;
        cursor = m.end;
      });
      return out + text.slice(cursor);
    }

    return {
      findMatches: findMatches,
      translate: translate,
      pickOutput: pickOutput,
      entryCount: dictionary.entries.length,
      patternCount: compiled.length
    };
  }

  const api = { createMatcher: createMatcher, PRESETS: PRESETS, configFor: configFor };

  root.SlangMatcher = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
