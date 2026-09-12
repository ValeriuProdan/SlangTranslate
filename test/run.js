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
const PHRASES = require('../src/data/packs.js').phrases;
const DETECT = require('../src/lib/detect.js');
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

test('the follow-up promise is translated as a promise', function () {
  // With a subject and a modal it is a whole clause, and gets a clause back.
  matchesEntry('I will follow up tomorrow', 'will-follow-up');
});

test('a bare follow-up keeps the sentence\'s own subject', function () {
  // Without them it is just a verb, so the replacement is a verb that keeps
  // whatever subject and modal the sentence already had.
  matchesEntry('Please follow up with them', 'follow-up');
  const out = matcher.translate('Please follow up with them');
  ok(out.indexOf('Please ') === 0, 'the sentence keeps its opening: ' + out);
});

test('optional slots cover the shorter phrasing', function () {
  matchesEntry('Following up on this', 'follow-up');
});

test('typos still match', function () {
  matchesEntry('I will folow up tomorrow', 'will-follow-up');
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
  // "circle back on this" is a verb; "let us circle back on this" is the
  // whole promise. Both fit at this position, and the longer one wins.
  const matches = matcher.findMatches('let us circle back on this');
  eq(matches.length, 1, 'one match, not "circle back" on its own');
  eq(matches[0].original, 'let us circle back on this');
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

function uncovered(packId, phrases) {
  return phrases
    .filter(function (entry) { return !PACKS.covers(packId, entry.id); })
    .map(function (entry) { return entry.id; });
}

test('every pack covers all the English-source phrases', function () {
  // English corporate speak turns up in everyone's inbox, so every language
  // needs an answer for it.
  const english = PHRASES.entries.filter(function (e) { return e.src === 'en'; });
  ok(english.length > 100, 'expected the English phrase list to be the bulk of it');
  PACKS.list().forEach(function (pack) {
    const missing = uncovered(pack.id, english);
    ok(missing.length === 0, pack.id + ' is missing: ' + missing.join(', '));
  });
});

test('a pack covers the corporate speak of its own language', function () {
  PACKS.list().forEach(function (pack) {
    const own = PHRASES.entries.filter(function (e) { return e.src === pack.id; });
    const missing = uncovered(pack.id, own);
    ok(missing.length === 0, pack.id + ' cannot say its own: ' + missing.join(', '));
  });
});

test('a pack is not expected to know another language\'s corporate speak', function () {
  // English has no reason to carry "raman la dispozitia dumneavoastra", and
  // relabel() drops what a pack cannot say rather than borrowing.
  const romanian = PHRASES.entries.filter(function (e) { return e.src === 'ro'; });
  ok(romanian.length > 0, 'expected some Romanian-source phrases');
  eq(uncovered('en', romanian).length, romanian.length, 'English should cover none of them');
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
      const value = out[id];
      const lists = Array.isArray(value) ? { base: value } : value;
      ok(lists.base && lists.base.length, pack.id + '/' + id + ' needs a base form');
      Object.keys(lists).forEach(function (form) {
        ok(['base', 'ing', 'ed', 's'].indexOf(form) !== -1, pack.id + '/' + id + ' has unknown form ' + form);
        lists[form].forEach(function (text) {
          ok(typeof text === 'string' && text.trim().length, pack.id + '/' + id + '.' + form + ' has an empty replacement');
        });
      });
    });
  });
});

test('both languages build and match', function () {
  ['ro', 'en'].forEach(function (id) {
    const built = PACKS.build(id);
    const m = M.createMatcher(built);
    ok(built.entries.length > 100, id + ' should build a real dictionary');
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

// ---------------------------------------------------------------- version

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'));
}

test('the manifest and package versions agree', function () {
  // The popup shows the manifest version, so a drifting package.json would
  // quietly make every release note wrong.
  eq(readJson('package.json').version, readJson('manifest.json').version);
});

test('the version is plain semver', function () {
  const version = readJson('manifest.json').version;
  // Chrome accepts up to four dot-separated integers and nothing else --
  // no "-beta", no leading zeroes.
  ok(/^\d+(\.\d+){0,3}$/.test(version), JSON.stringify(version) + ' is not a version Chrome will load');
  version.split('.').forEach(function (part) {
    ok(String(Number(part)) === part, 'version part ' + JSON.stringify(part) + ' has a leading zero');
    ok(Number(part) <= 65535, 'version parts max out at 65535');
  });
});

test('the popup asks the manifest for the version', function () {
  // A hardcoded copy in the popup would be the thing that goes stale.
  const src = fs.readFileSync(path.join(__dirname, '../src/popup/popup.js'), 'utf8');
  ok(src.indexOf('chrome.runtime.getManifest().version') !== -1,
    'the popup should read the version from the manifest');
  const html = fs.readFileSync(path.join(__dirname, '../src/popup/popup.html'), 'utf8');
  ok(html.indexOf('id="version"') !== -1, 'the popup needs somewhere to put it');
});

// ---------------------------------------------------------------- language

test('plain English is detected as English', function () {
  [
    'Hi team, just checking in on the action items from our sync.',
    'I do not have the bandwidth this sprint, so let us park this.'
  ].forEach(function (text) {
    const guess = DETECT.detect(text);
    ok(guess && guess.id === 'en', JSON.stringify(text) + ' -> ' + (guess ? guess.id : 'null'));
  });
});

test('plain Romanian is detected as Romanian, diacritics or not', function () {
  [
    'Bună, îți trimit raportul mai târziu astăzi.',
    'Buna, iti trimit raportul mai tarziu astazi.'
  ].forEach(function (text) {
    const guess = DETECT.detect(text);
    ok(guess && guess.id === 'ro', JSON.stringify(text) + ' -> ' + (guess ? guess.id : 'null'));
  });
});

test('romgleza is Romanian, not English', function () {
  // The borrowed words are nouns; the grammar holding them together is not.
  [
    'Am facut deploy la feature-ul ala, dar mai avem un blocker.',
    'Bag un follow up maine daca nu raspunde nimeni.',
    'Hai sa dam un sync, ca avem deadline la task-urile astea.'
  ].forEach(function (text) {
    const guess = DETECT.detect(text);
    ok(guess && guess.id === 'ro', JSON.stringify(text) + ' -> ' + (guess ? guess.id : 'null'));
  });
});

test('the corporate phrase itself does not get a vote', function () {
  // "at the end of the day" is five English function words; left in, it
  // drowns out the short Romanian sentence carrying it.
  const text = 'Hai sa dam un sync maine, at the end of the day tot noi facem treaba.';
  const matcher = M.createMatcher(PACKS.build('ro'));
  const ranges = matcher.findMatches(text).map(function (m) { return [m.start, m.end]; });
  ok(ranges.length, 'expected the phrase to match');
  const guess = DETECT.detect(text, ranges);
  ok(guess && guess.id === 'ro', 'excluding the phrase should leave Romanian');
});

test('too little text is an honest shrug, not a guess', function () {
  eq(DETECT.detect('FYI'), null);
  eq(DETECT.detect('ok'), null);
  eq(DETECT.detect(''), null);
});

test('Romanian corporate speak is matched and translated', function () {
  const ro = M.createMatcher(PACKS.build('ro'));
  const out = ro.translate('Ramanem la dispozitia dumneavoastra, cu stima.');
  ok(out.indexOf('dispozitia') === -1, 'the formula should be gone: ' + out);
  ok(out.indexOf('stima') === -1, 'the sign-off too: ' + out);
});

test('Romanian corporate speak is dropped, not mistranslated, in English', function () {
  const text = 'Ramanem la dispozitia dumneavoastra.';
  const matcher = M.createMatcher(PACKS.build('ro'));
  const matches = matcher.findMatches(text);
  ok(matches.length, 'the Romanian matcher should find it');
  const kept = M.relabel(text, matches, function (id, original) {
    return PACKS.replacementFor('en', id, original);
  });
  eq(kept.length, 0, 'English has no words for it, so nothing is rewritten');
});

test('an English-source phrase still works in both packs', function () {
  ['ro', 'en'].forEach(function (id) {
    const out = M.createMatcher(PACKS.build(id)).translate('FYI');
    ok(out !== 'FYI', id + ' should have rewritten FYI');
  });
});

// ---------------------------------------------------------------- fit

const en = M.createMatcher(PACKS.build('en'));

test('a word that merely resembles a corporate verb is left alone', function () {
  // "ideas" is one stem-edit from "ideating"; it is also a different word.
  eq(en.translate('We are exploring various ideas and are looking for feedback.'),
     'We are exploring various ideas and are looking for feedback.');
});

test('the replacement takes the form of the word it replaces', function () {
  const forms = { 'escalate': 'base', 'escalating': 'ing', 'escalated': 'ed', 'escalates': 's' };
  Object.keys(forms).forEach(function (word) {
    const match = en.findMatches('they ' + word + ' everything')[0];
    ok(match, word + ' should match');
    eq(match.form, forms[word], word);
  });
  eq(en.translate('She is escalating this'), 'She is telling the boss this');
  eq(en.translate('He escalates everything'), 'He tells the boss everything');
});

test('an exact-word slot ignores typos and stems', function () {
  eq(en.translate('We need to move forward.'), 'We need to move forward.', 'the verb is not the adverb');
  ok(en.translate('Moving forward, we ship weekly.').indexOf('From now on') === 0, 'the adverb still is');
});

test('a verb replacement keeps the sentence\'s subject and modal', function () {
  ok(/^we should (shelve it|kick it down the road)$/.test(en.translate('we should park this')),
     'the sentence keeps "we should": ' + en.translate('we should park this'));
  eq(en.translate('we should sync up'), 'we should have a quick word');
  eq(en.translate('this adds value'), 'this is useful');
});

test('a replacement that precedes an object still precedes it', function () {
  eq(en.translate('Please find attached the report.'), "Here's the report.");
  eq(en.translate('looping in Dana'), 'roping in Dana');
});

test('a form that a pack does not spell out falls back to base', function () {
  eq(M.formOf({ base: ['b'], ing: ['i'] }, 'ed').join(), 'b');
  eq(M.formOf(['plain'], 'ing').join(), 'plain', 'a plain list is every form');
});

test('a pattern may star at most one slot', function () {
  PHRASES.entries.forEach(function (entry) {
    entry.p.forEach(function (source) {
      const stars = P.parsePattern(source).slots.filter(function (s) { return s.inflects; }).length;
      ok(stars <= 1, entry.id + ' / ' + source + ' stars ' + stars + ' slots');
    });
  });
});

test('every starred English entry spells out its forms', function () {
  // If the pattern says the word inflects, the pack had better be able to.
  const out = PACKS.get('en').out;
  PHRASES.entries.forEach(function (entry) {
    const starred = entry.p.some(function (source) {
      return P.parsePattern(source).slots.some(function (s) { return s.inflects; });
    });
    if (!starred) return;
    const value = out[entry.id];
    ok(value && !Array.isArray(value), entry.id + ' is starred but has no forms in English');
    ok(value.base && value.base.length, entry.id + ' needs a base form');
    // A noun only needs a plural; a verb that has -ing must have the rest.
    ok(value.s && value.s.length, entry.id + ' needs an s form (plural or third person)');
    if (value.ing) {
      ok(value.ed && value.ed.length, entry.id + ' has -ing but no -ed');
    }
  });
});

test('a lookahead slot vouches for the match but stays in the text', function () {
  eq(en.translate('We should leverage our network.'), 'We should use our network.');
  eq(en.translate('He has a lot of leverage with the landlord.'), 'He has a lot of leverage with the landlord.',
    'the noun sense has no determiner after it, so it is left alone');
  const match = en.findMatches('leverage the data')[0];
  eq(match.original, 'leverage', 'only the verb is inside the match');
});

test('lookahead slots must come last', function () {
  let threw = false;
  try { P.parsePattern('>the *leverage'); } catch (err) { threw = true; }
  ok(threw, 'a leading lookahead should be rejected');
  threw = false;
  try { P.parsePattern('>the >thing'); } catch (err) { threw = true; }
  ok(threw, 'a pattern of only lookaheads matches nothing and should be rejected');
});

test('countable nouns come out in the right number', function () {
  eq(en.translate('We have two blockers.'), 'We have two things holding everything up.');
  eq(en.translate('We have a blocker.'), 'We have a thing holding everything up.');
  eq(en.translate('the stakeholders agreed'), 'the people with opinions agreed');
});

test('everyday prose is left alone', function () {
  [
    'We are exploring various ideas for the summer.',
    'She sprints the last mile which I think is madness.',
    'The retro camera you lent me takes lovely pictures.',
    'I aligned the shelves in the garage.',
    'Natural resources in the region are mostly timber.',
    'The capacity of the hall is about three hundred people.',
    'I read your draft and had a few thoughts about the ending.',
    'He bumped into her at the shop.',
    'Sync your phone before you leave.',
    // Words the researched additions put at risk.
    'We went to a pop culture convention and the culture of the town is lovely.',
    'She is an agile gymnast and moves faster than anyone I know.',
    'The table was set for eight and I tabled the plates myself.',
    'He gave 110 dollars to the fundraiser and another 50 later.',
    'There was a debriefing room at the back of the museum.',
    'I leaned in to hear her better.',
    'The runway at the small airport is being resurfaced this month.',
    'Our cat keeps herding the chickens into the shed.',
    'I peeled the onion for the soup and cried the whole time.',
    'My priorities have changed since the baby arrived.',
    'The scale of the mountain is hard to judge from here.',
    'He works at a call centre and answers the phone all day.'
  ].forEach(function (text) { eq(en.translate(text), text); });
  const ro = M.createMatcher(PACKS.build('ro'));
  [
    'Aparatul foto retro face poze superbe.',
    'Am aliniat rafturile din garaj.',
    'Resursele naturale din zona sunt lemn.',
    'Ne uitam la un film si mancam popcorn.',
    'Copilul a facut o casuta din lego.'
  ].forEach(function (text) { eq(ro.translate(text), text); });
});

// ---------------------------------------------------------------- research

test('a noun no longer matches the verb entry it resembles', function () {
  // "priorities" was stem-matching the verb "prioritize", giving
  // "strategic focuses on". The verb slot is exact now.
  eq(en.translate('strategic priorities'), 'things that matter, apparently');
  eq(en.translate('we must prioritize this'), 'we must focus on this');
});

test('a replacement does not bring a second determiner', function () {
  // "our top priorities" was becoming "our the most urgent (...)".
  eq(en.translate('our top priorities'), 'our most urgent things (like everything else)');
  eq(en.translate('our top priority'), 'our most urgent thing (like everything else)');
  eq(en.translate('our company culture is strong'), 'the vibe, allegedly is strong');
  eq(en.translate('a quick debrief'), 'a recap');
});

test('the researched English additions all fire', function () {
  const cases = {
    'the new normal': 'new-normal',
    'boots on the ground': 'boots-on-ground',
    'give 110 percent': 'give-110',
    'let us table this': 'table-this',
    'close the loop on this': 'close-the-loop',
    'a sanity check': 'sanity-check',
    'business as usual': 'bau',
    'the KPIs are down': 'kpi',
    'our OKRs': 'okr',
    'the pain points': 'pain-points',
    'our value proposition': 'value-prop',
    'best in class': 'best-in-class',
    'at scale': 'at-scale',
    'a cross functional team': 'cross-functional',
    'our runway is short': 'runway',
    'like herding cats': 'herding-cats',
    'they moved the goalposts': 'move-goalposts',
    'TBD': 'tbd',
    'be agile': 'agile',
    'our company culture is strong': 'culture'
  };
  Object.keys(cases).forEach(function (text) {
    const ids = en.findMatches(text).map(function (m) { return m.entry.id; });
    ok(ids.indexOf(cases[text]) !== -1, JSON.stringify(text) + ' should fire ' + cases[text] + ', got [' + ids.join(', ') + ']');
  });
});

test('romgleza is caught, not just formal Romanian', function () {
  const ro = M.createMatcher(PACKS.build('ro'));
  const cases = {
    'Crezi ca face sens?': 'ro-face-sens',
    'Am niste task-uri de facut': 'ro-taskuri',
    'deadline-ul e vineri': 'ro-deadline',
    'Hai sa dam un call': 'ro-call',
    'Avem un meeting la 3': 'ro-meeting',
    'Customizam produsul': 'ro-customiza',
    'Sharuim cu echipa': 'ro-sharui',
    'Ne focusam pe asta': 'ro-focusa',
    'Adresam problema': 'ro-adresa',
    'Updatam documentul': 'ro-updata',
    'Aplic pentru pozitia asta': 'ro-aplica',
    'Per total a mers bine': 'ro-per-total',
    'Task-urile sunt time consuming': 'ro-time-consuming'
  };
  Object.keys(cases).forEach(function (text) {
    const ids = ro.findMatches(text).map(function (m) { return m.entry.id; });
    ok(ids.indexOf(cases[text]) !== -1, JSON.stringify(text) + ' should fire ' + cases[text] + ', got [' + ids.join(', ') + ']');
  });
});

test('the institutional register was dropped', function () {
  const ro = M.createMatcher(PACKS.build('ro'));
  [
    'Vă informăm că demarăm procedura.',
    'Cu celeritate, la momentul oportun.',
    'Facem demersuri pentru a duce la bun sfarsit.'
  ].forEach(function (text) { eq(ro.translate(text), text); });
});

test('but the email formulas were kept', function () {
  const ro = M.createMatcher(PACKS.build('ro'));
  ['Cu stima', 'Raman la dispozitia dumneavoastra', 'Va multumesc anticipat'].forEach(function (text) {
    ok(ro.translate(text) !== text, JSON.stringify(text) + ' should still be rewritten');
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
