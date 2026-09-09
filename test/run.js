/**
 * Dependency-free test runner: node test/run.js
 */
'use strict';

const N = require('../src/lib/normalize.js');
const F = require('../src/lib/fuzzy.js');
const P = require('../src/lib/pattern.js');
const M = require('../src/lib/matcher.js');
const PAUSE = require('../src/lib/pause.js');
const fs = require('fs');
const path = require('path');
const PHRASES = require('../src/data/phrases.js');
const PACKS = require('../src/data/packs.js');

const DICT = PACKS.build('ro');
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

test('every phrase has a unique id', function () {
  const seen = new Set();
  PHRASES.entries.forEach(function (entry) {
    ok(!seen.has(entry.id), 'duplicate id: ' + entry.id);
    seen.add(entry.id);
  });
});

test('every phrase has at least one pattern', function () {
  PHRASES.entries.forEach(function (entry) {
    ok(entry.p && entry.p.length, entry.id + ' has no patterns');
  });
});

test('every pattern parses', function () {
  PHRASES.entries.forEach(function (entry) {
    entry.p.forEach(function (source) {
      try {
        P.parsePattern(source);
      } catch (err) {
        throw new Error(entry.id + ' / ' + JSON.stringify(source) + ': ' + err.message);
      }
    });
  });
});

test('no pattern is claimed by two phrases', function () {
  const owner = new Map();
  PHRASES.entries.forEach(function (entry) {
    entry.p.forEach(function (source) {
      const key = source.toLowerCase();
      ok(!owner.has(key), JSON.stringify(source) + ' is in both ' + owner.get(key) + ' and ' + entry.id);
      owner.set(key, entry.id);
    });
  });
});

test('every pattern actually fires on its own words', function () {
  const broken = [];
  PHRASES.entries.forEach(function (entry) {
    entry.p.forEach(function (source) {
      // Build the plainest sentence the pattern can match: required slots only.
      const probe = P.parsePattern(source).slots
        .filter(function (slot) { return !slot.optional; })
        .map(function (slot) { return slot.alts[0].norm; })
        .join(' ');
      if (!matcher.findMatches(probe).length) {
        broken.push(entry.id + ' / ' + JSON.stringify(source) + ' -> no match on ' + JSON.stringify(probe));
      }
    });
  });
  ok(broken.length === 0, 'unreachable patterns:\n    ' + broken.join('\n    '));
});

// ---------------------------------------------------------------- packs

test('every language pack covers every phrase', function () {
  PACKS.list().forEach(function (pack) {
    const full = PACKS.get(pack.id);
    const missing = PHRASES.entries
      .filter(function (entry) {
        const out = full.out[entry.id];
        return !out || !out.length;
      })
      .map(function (entry) { return entry.id; });
    ok(missing.length === 0, pack.id + ' is missing: ' + missing.join(', '));
  });
});

test('no pack invents ids the phrase list does not have', function () {
  const known = new Set(PHRASES.entries.map(function (e) { return e.id; }));
  PACKS.list().forEach(function (pack) {
    Object.keys(PACKS.get(pack.id).out).forEach(function (id) {
      ok(known.has(id), pack.id + ' has replacements for unknown phrase ' + id);
    });
  });
});

test('every replacement is a non-empty string', function () {
  PACKS.list().forEach(function (pack) {
    const out = PACKS.get(pack.id).out;
    Object.keys(out).forEach(function (id) {
      out[id].forEach(function (text) {
        ok(typeof text === 'string' && text.trim().length, pack.id + '/' + id + ' has an empty replacement');
      });
    });
  });
});

test('both languages build and match', function () {
  ['ro', 'en'].forEach(function (id) {
    const built = PACKS.build(id);
    const m = M.createMatcher(built);
    eq(built.entries.length, PHRASES.entries.length, id + ' entry count');
    ok(m.findMatches('FYI I will follow up before EOD').length >= 2, id + ' should match a corporate sentence');
  });
});

test('the English pack rewrites into English', function () {
  const en = M.createMatcher(PACKS.build('en'));
  const out = en.translate('Please advise at your earliest convenience.');
  ok(out.indexOf('Please advise') === -1, 'the corporate phrasing should be gone');
  ok(/[a-z]/.test(out), 'and replaced with something');
});

test('the two packs disagree, as they should', function () {
  const ro = M.createMatcher(PACKS.build('ro')).translate('FYI');
  const en = M.createMatcher(PACKS.build('en')).translate('FYI');
  ok(ro !== en, 'same input, different language, different output');
});

test('an unknown language falls back to the default', function () {
  eq(PACKS.build('klingon').id, PACKS.DEFAULT_ID);
});

test('a partial pack drops only the phrases it lacks', function () {
  // Packs are allowed to be incomplete; build() must skip, not crash.
  PACKS.register({ id: 'test-partial', label: 'Partial', nativeLabel: 'Partial', out: { fyi: ['x'] } });
  const built = PACKS.build('test-partial');
  eq(built.entries.length, 1);
  eq(built.entries[0].id, 'fyi');
});

// ---------------------------------------------------------------- pause

// A fixed afternoon to reason about, so "until tomorrow" is deterministic.
const AFTERNOON = new Date(2026, 8, 9, 14, 30, 0).getTime();
const MINUTE = 60000;

test('a pause in the future is a pause', function () {
  ok(PAUSE.isPaused(AFTERNOON + MINUTE, AFTERNOON));
});

test('an expired pause is not a pause', function () {
  ok(!PAUSE.isPaused(AFTERNOON - MINUTE, AFTERNOON), "a stale timestamp must not keep it paused");
  ok(!PAUSE.isPaused(0, AFTERNOON), "zero means never paused");
});

test('fixed durations land where expected', function () {
  eq(PAUSE.until('15m', AFTERNOON), AFTERNOON + 15 * MINUTE);
  eq(PAUSE.until('1h', AFTERNOON), AFTERNOON + 60 * MINUTE);
});

test('an unknown duration pauses nothing', function () {
  eq(PAUSE.until('next tuesday', AFTERNOON), 0);
});

test('"until tomorrow" means the next resume hour', function () {
  const end = PAUSE.until('tomorrow', AFTERNOON);
  const date = new Date(end);
  eq(date.getHours(), PAUSE.RESUME_HOUR);
  eq(date.getMinutes(), 0);
  eq(date.getDate(), new Date(AFTERNOON).getDate() + 1, 'the next calendar day');
  ok(PAUSE.isNextDay(end, AFTERNOON));
});

test('pausing after midnight resumes the same morning', function () {
  // At 03:00 the next resume hour is 08:00 today, not tomorrow.
  const lateNight = new Date(2026, 8, 9, 3, 0, 0).getTime();
  const end = PAUSE.until('tomorrow', lateNight);
  eq(new Date(end).getDate(), new Date(lateNight).getDate());
  ok(!PAUSE.isNextDay(end, lateNight));
  ok(end > lateNight, "and it is still in the future");
});

test('remaining time never goes negative', function () {
  eq(PAUSE.remaining(AFTERNOON - MINUTE, AFTERNOON), 0);
  eq(PAUSE.remaining(AFTERNOON + 5 * MINUTE, AFTERNOON), 5 * MINUTE);
  eq(PAUSE.remaining(0, AFTERNOON), 0);
});

test('the countdown reads sensibly', function () {
  eq(PAUSE.formatRemaining(30 * 1000), '<1m');
  eq(PAUSE.formatRemaining(MINUTE), '1m');
  eq(PAUSE.formatRemaining(45 * MINUTE), '45m');
  eq(PAUSE.formatRemaining(60 * MINUTE), '1h');
  eq(PAUSE.formatRemaining(90 * MINUTE), '1h 30m');
  eq(PAUSE.formatRemaining(0), '');
});

test('the end time is zero-padded wall clock', function () {
  eq(PAUSE.formatUntil(new Date(2026, 8, 9, 9, 5, 0).getTime()), '09:05');
  eq(PAUSE.formatUntil(new Date(2026, 8, 9, 21, 25, 0).getTime()), '21:25');
});

test('every offered duration actually pauses', function () {
  PAUSE.DURATIONS.forEach(function (duration) {
    const end = PAUSE.until(duration.id, AFTERNOON);
    ok(end > AFTERNOON, duration.id + ' should end in the future');
    ok(PAUSE.isPaused(end, AFTERNOON), duration.id + ' should read as paused');
    ok(duration.labelKey, duration.id + ' needs a label key for the popup');
  });
});

// ---------------------------------------------------------------- popup labels

/**
 * The popup labels itself from a table keyed by language. A missing key
 * renders as an empty row rather than an error, so it is worth a test:
 * read the tables out of the source and check them against the markup.
 */
function popupStrings() {
  const src = fs.readFileSync(path.join(__dirname, '../src/popup/popup.js'), 'utf8');
  const start = src.indexOf('const STRINGS = ');
  const end = src.indexOf('\n};', start);
  ok(start !== -1 && end !== -1, 'could not find the STRINGS table');
  const literal = src.slice(start + 'const STRINGS = '.length, end + 2);
  return new Function('return ' + literal)();
}

test('every language labels the popup with the same keys', function () {
  const strings = popupStrings();
  const languages = Object.keys(strings);
  ok(languages.length >= 2, 'expected at least two languages');
  const reference = Object.keys(strings[languages[0]]).sort();
  languages.forEach(function (id) {
    const keys = Object.keys(strings[id]).sort();
    const missing = reference.filter(function (k) { return keys.indexOf(k) === -1; });
    const extra = keys.filter(function (k) { return reference.indexOf(k) === -1; });
    ok(!missing.length, id + ' is missing labels: ' + missing.join(', '));
    ok(!extra.length, id + ' has labels no other language has: ' + extra.join(', '));
  });
});

test('no popup label is blank', function () {
  const strings = popupStrings();
  Object.keys(strings).forEach(function (id) {
    Object.keys(strings[id]).forEach(function (key) {
      const value = strings[id][key];
      ok(typeof value === 'string' && value.trim().length, id + '.' + key + ' is blank');
    });
  });
});

test('every data-i18n in the markup has a string', function () {
  const strings = popupStrings();
  const html = fs.readFileSync(path.join(__dirname, '../src/popup/popup.html'), 'utf8');
  const used = (html.match(/data-i18n="([^"]+)"/g) || []).map(function (attr) {
    return attr.slice(11, -1);
  });
  ok(used.length, 'expected the popup to use data-i18n');
  Object.keys(strings).forEach(function (id) {
    used.forEach(function (key) {
      ok(strings[id][key], id + ' has no string for data-i18n="' + key + '"');
    });
  });
});

test('the pause durations all have labels in every language', function () {
  const strings = popupStrings();
  Object.keys(strings).forEach(function (id) {
    PAUSE.DURATIONS.forEach(function (duration) {
      ok(strings[id][duration.labelKey], id + ' has no label for the ' + duration.id + ' pause');
    });
  });
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
console.log('  ' + PHRASES.entries.length + ' phrases, ' + matcher.patternCount + ' patterns');
console.log('  packs: ' + PACKS.list().filter(function (p) { return p.id.indexOf('test-') !== 0; })
  .map(function (p) { return p.nativeLabel + ' (' + p.coverage + ')'; }).join(', ') + '\n');
