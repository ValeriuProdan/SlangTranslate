/**
 * Dependency-free test runner: node test/run.js
 */
'use strict';

const N = require('../src/lib/normalize.js');
const F = require('../src/lib/fuzzy.js');
const P = require('../src/lib/pattern.js');
const M = require('../src/lib/matcher.js');
const DICT = require('../src/data/dictionary-ro.js');

const matcher = M.createMatcher(DICT);
const failures = [];
let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failures.push([name, err.message]);
  }
}

function eq(actual, expected, note) {
  if (actual !== expected) {
    throw new Error((note ? note + ': ' : '') +
      'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

function ok(value, note) {
  if (!value) throw new Error(note || 'expected truthy');
}

/**
 * Assert that `text` fires the dictionary entry `entryId`. Which of the
 * entry's variants gets used is deliberately arbitrary, so tests assert on
 * the match, never on the exact Romanian text.
 */
function matchesEntry(text, entryId) {
  const matches = matcher.findMatches(text);
  const ids = matches.map(function (m) { return m.entry.id; });
  if (ids.indexOf(entryId) === -1) {
    throw new Error(JSON.stringify(text) + ' -> ' + JSON.stringify(matcher.translate(text)) +
      ', expected entry ' + JSON.stringify(entryId) + ', got [' + ids.join(', ') + ']');
  }
}

function unchanged(text) {
  const out = matcher.translate(text);
  if (out !== text) {
    throw new Error('expected no change, but ' + JSON.stringify(text) + ' -> ' + JSON.stringify(out));
  }
}

// ---------------------------------------------------------------- normalize

test('tokenizer keeps apostrophes inside a token', function () {
  eq(N.tokenize("let's go").map(function (t) { return t.norm; }).join('|'), 'lets|go');
});

test('tokenizer splits hyphenated words the same way as spaced ones', function () {
  eq(N.tokenize('follow-up').map(function (t) { return t.norm; }).join('|'), 'follow|up');
});

test('dotted acronyms do not count as sentence breaks', function () {
  const tokens = N.tokenize('F.Y.I. this');
  eq(tokens[1].breakBefore, false, 'Y after F');
  eq(tokens[3].breakBefore, true, '"this" after the final period');
});

test('stemmer collapses verb forms', function () {
  eq(N.stem('following'), 'follow');
  eq(N.stem('followed'), 'follow');
  eq(N.stem('meetings'), 'meeting');
});

test('diacritics are stripped for comparison', function () {
  eq(N.normalizeWord('STII'), 'stii');
  eq(N.stripDiacritics('sa stii'), 'sa stii');
});

test('casing follows the original', function () {
  eq(N.applyCase('Please advise', 'zi ceva', true), 'Zi ceva');
  eq(N.applyCase('PLEASE ADVISE', 'zi ceva', true), 'ZI CEVA');
  eq(N.applyCase('FYI', 'ca sa stii', false), 'ca sa stii', 'acronym mid-sentence stays lowercase');
});

test('sentence starts are detected after breaks', function () {
  ok(N.isSentenceStart('Hello. FYI', 7));
  ok(N.isSentenceStart('Hi team,\nFYI', 9), 'a new line starts a sentence');
  ok(!N.isSentenceStart('and FYI', 4));
});

test('URLs and addresses are left alone', function () {
  ok(N.looksLikeMachineText('see https://example.com/fyi'));
  ok(N.looksLikeMachineText('write to fyi@example.com'));
  ok(!N.looksLikeMachineText('just a normal sentence'));
});

// ---------------------------------------------------------------- fuzzy

test('edit distance counts transpositions as one edit', function () {
  eq(F.editDistance('emial', 'email', 3), 1);
});

test('edit distance bails out past the budget', function () {
  eq(F.editDistance('abcdef', 'zzzzzz', 2), 3, 'returns max + 1 once it gives up');
});

test('typo budget scales with word length', function () {
  eq(F.budgetFor(3), 0);
  eq(F.budgetFor(6), 1);
  eq(F.budgetFor(9), 2);
});

test('short words demand an exact match', function () {
  const cfg = M.configFor('normal');
  const tok = function (w) {
    const n = N.normalizeWord(w);
    return { norm: n, stem: N.stem(n) };
  };
  eq(F.tokenScore(tok('sync'), tok('sink'), cfg), 0, '"sink" is not a typo of "sync"');
  ok(F.tokenScore(tok('bandwith'), tok('bandwidth'), cfg) > 0.8, 'but "bandwith" is a typo of "bandwidth"');
});

// ---------------------------------------------------------------- patterns

test('pattern parser marks optional slots and alternatives', function () {
  const p = P.parsePattern('?(i|we) ?(will|ll) follow up');
  eq(p.slots.length, 4);
  eq(p.slots[0].optional, true);
  eq(p.slots[0].alts.length, 2);
  eq(p.required, 2);
});

test('leading optional slots widen the first-letter index', function () {
  const p = P.parsePattern('?(i|we) ?(will|ll) follow up');
  eq(p.firstChars.sort().join(''), 'filw');
});

test('a pattern of only optional slots is rejected', function () {
  let threw = false;
  try { P.parsePattern('?maybe ?nothing'); } catch (err) { threw = true; }
  ok(threw, 'should refuse a pattern that can match nothing');
});

test('spaces inside alternatives are rejected loudly', function () {
  let threw = false;
  try { P.parsePattern('?(a|just a) reminder'); } catch (err) { threw = true; }
  ok(threw);
});

// ---------------------------------------------------------------- matching

test('plain acronyms are translated', function () {
  matchesEntry('FYI the deploy is late', 'fyi');
});

test('dotted acronyms are translated', function () {
  matchesEntry('F.Y.I. the deploy is late', 'fyi');
});

test('the follow-up promise is translated', function () {
  matchesEntry('I will follow up tomorrow', 'follow-up');
});

test('optional slots cover the shorter phrasing', function () {
  matchesEntry('Following up on this', 'follow-up');
});

test('typos still match', function () {
  matchesEntry('I will folow up tomorrow', 'follow-up');
  matchesEntry('we have no bandwith left', 'bandwidth');
  matchesEntry('as per my lst emial', 'per-my-last-email');
});

test('contractions match their expanded form', function () {
  matchesEntry("we'll follow up", 'follow-up');
});

test('casing is preserved on the replacement', function () {
  const out = matcher.translate('Please advise.');
  eq(out.charAt(0), out.charAt(0).toUpperCase(), 'sentence-initial match stays capitalised');
});

test('matches do not span a sentence boundary', function () {
  unchanged('I sent the email. Up next: lunch.');
});

test('a phrase wrapped across source lines still matches', function () {
  // HTML wraps text arbitrarily; a single newline renders as a space, so it
  // must not stop a match the way a paragraph break does.
  matchesEntry('I do not\n      have the bandwidth this week', 'no-bandwidth');
});

test('a blank line does stop a match', function () {
  unchanged('I sent the email. Up next: lunch.');
  const across = matcher.findMatches('nothing to follow\n\nup on');
  ok(across.every(function (m) { return m.original.indexOf('follow') === -1; }),
    'must not match across a paragraph break');
});

test('overlapping matches resolve to the longest one', function () {
  const matches = matcher.findMatches('let us take this offline');
  eq(matches.length, 1, 'one match, not "let us" plus "offline"');
  eq(matches[0].original, 'let us take this offline');
});

test('variant choice is deterministic', function () {
  eq(matcher.translate('FYI'), matcher.translate('FYI'));
});

test('everyday English is left alone', function () {
  [
    'The cat sat on the mat and refused to budge.',
    'Can you send me the photos from Saturday?',
    'I finished the book last night and it was excellent.',
    'We are driving to the seaside if the weather holds.'
  ].forEach(unchanged);
});

test('character offsets line up with the source text', function () {
  const text = 'Hello, FYI, we are late.';
  const match = matcher.findMatches(text)[0];
  eq(text.slice(match.start, match.end), match.original);
});

// ---------------------------------------------------------------- dictionary

test('every entry has a unique id', function () {
  const seen = new Set();
  DICT.entries.forEach(function (entry) {
    ok(!seen.has(entry.id), 'duplicate id: ' + entry.id);
    seen.add(entry.id);
  });
});

test('every entry has patterns and replacements', function () {
  DICT.entries.forEach(function (entry) {
    ok(entry.p && entry.p.length, entry.id + ' has no patterns');
    ok(entry.ro && entry.ro.length, entry.id + ' has no replacements');
    entry.ro.forEach(function (text) {
      ok(typeof text === 'string' && text.trim().length, entry.id + ' has an empty replacement');
    });
  });
});

test('every pattern in the dictionary parses', function () {
  DICT.entries.forEach(function (entry) {
    entry.p.forEach(function (source) {
      try {
        P.parsePattern(source);
      } catch (err) {
        throw new Error(entry.id + ' / ' + JSON.stringify(source) + ': ' + err.message);
      }
    });
  });
});

test('no pattern is claimed by two entries', function () {
  const owner = new Map();
  DICT.entries.forEach(function (entry) {
    entry.p.forEach(function (source) {
      const key = source.toLowerCase();
      ok(!owner.has(key), JSON.stringify(source) + ' is in both ' + owner.get(key) + ' and ' + entry.id);
      owner.set(key, entry.id);
    });
  });
});

test('every entry actually fires on its own patterns', function () {
  const broken = [];
  DICT.entries.forEach(function (entry) {
    entry.p.forEach(function (source) {
      // Build the plainest sentence the pattern can match: required slots only.
      const probe = P.parsePattern(source).slots
        .filter(function (slot) { return !slot.optional; })
        .map(function (slot) { return slot.alts[0].norm; })
        .join(' ');
      const matches = matcher.findMatches(probe);
      if (!matches.length) broken.push(entry.id + ' / ' + JSON.stringify(source) + ' -> no match on ' + JSON.stringify(probe));
    });
  });
  ok(broken.length === 0, 'unreachable patterns:\n    ' + broken.join('\n    '));
});

// ---------------------------------------------------------------- report

console.log('');
if (failures.length) {
  failures.forEach(function (entry) {
    console.log('  FAIL  ' + entry[0] + '\n        ' + entry[1]);
  });
  console.log('\n' + passed + ' passed, ' + failures.length + ' failed\n');
  process.exit(1);
}
console.log('  ' + passed + ' passed');
console.log('  dictionary: ' + matcher.entryCount + ' entries, ' + matcher.patternCount + ' patterns\n');
