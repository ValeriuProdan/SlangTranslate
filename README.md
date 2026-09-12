# Slang Translate

A Chrome extension that reads the email you are looking at and quietly rewrites
corporate speak into something a human would say. It works out which language
each passage is written in, so an English thread gets English slang and the
Romanian reply underneath it gets Romanian.

> **FYI, as per my last email, I will follow up before EOD.**

**Română:** Auzi ba, citește, bă, mailul, îți dau bip, poate before până pleacă lumea acasă.

**English:** Yo, listen up, read the email, mate, I'll nag you later before knocking-off time.

Everything happens locally in the tab. No network calls, no accounts, no
telemetry — the extension cannot send your mail anywhere because it never talks
to anything.

## Install (unpacked)

1. `git clone https://github.com/ValeriuProdan/SlangTranslate`
2. open `chrome://extensions`
3. turn on **Developer mode** (top right)
4. **Load unpacked** → pick this folder

It activates on Gmail, Outlook (web), Yahoo Mail, Proton Mail, Fastmail and
Zoho Mail. The toolbar badge shows how many phrases were swapped on the page;
the popup has the language picker, the on/off switch, the pause, the typo
tolerance, the list of what it caught, and the version it is running. The popup
speaks whichever language you are translating into.

**Click any rewritten phrase to see what was really written**, and click again
to put the slang back. Flipped phrases go grey so you can tell at a glance which
version you are reading. The highlight can be switched off in the popup; clicking
still works.

## Working out the language

The corporate phrases being hunted are English whatever language the writer
uses, so the phrase itself says nothing about them. What matters is the
language of the text *around* it — the carrier language — and that is decided
per passage, not per page.

**Romgleza is the case that shapes the design.** Romanians borrow English
*content* words — deploy, blocker, feature, deadline — while the grammar
holding the sentence together stays Romanian:

> Am făcut deploy la feature-ul ăla, dar mai avem un blocker.

Counting vocabulary would call that English. Counting *function words* — am,
la, dar, mai, un — calls it Romanian, correctly. So [detect.js](src/lib/detect.js)
is a function-word counter with a diacritics bonus, and nothing cleverer.

Two details do most of the work:

- **The matched phrase gets no vote.** "At the end of the day" is five English
  function words; left in the count it drowns out the short Romanian sentence
  carrying it. English-source phrases are excluded before scoring.
- **Romanian-source phrases *do* vote.** Nobody writes "rămânem la dispoziția
  dumneavoastră" in an English thread, so those are evidence rather than noise.

When a passage is too short to call — "FYI" on its own — the detector says so
rather than guessing, and the caller widens the context: the sentence, then the
surrounding block, then the page, then whatever you picked in the popup. You
can also just force a language and skip all of it.

## Pausing

The on/off switch stays where you put it. **Pause** is the temporary one — for
when you need to read an email as its author actually wrote it:

| | |
| --- | --- |
| 15 min | back shortly |
| 1 hour | back after this meeting |
| until tomorrow | back at 08:00 the next morning |

The page reverts to plain corporate English immediately and puts itself back
when the time is up. The badge shows `||` while paused, and the popup counts
down. Flipping the main switch back on cancels a running pause, since that is
an explicit "I want it now".

Pause needs no extra Chrome permission: the state is one timestamp in
`chrome.storage.local`, and the content script sets a single timer for the
remaining time. Because everything is derived by comparing that timestamp to
now, a stale value is harmless — once it is in the past, nothing is paused. It
is deliberately local rather than synced: pausing on your laptop should not
silently pause your desktop too.

## Try it without installing

```
open demo/index.html
```

A fake inbox that loads the real matching code straight from `src/`, with a
language picker of its own. Good for tuning — edit, reload, done.

## How the matching works

Naive find-and-replace breaks on the first `Pls advize` or `follow-up`, so the
matcher works on tokens rather than raw substrings.

1. **Normalize** — lowercase, strip diacritics, drop apostrophes. This alone
   makes `let's` == `lets`, `follow-up` == `follow up`, `F.Y.I.` == `FYI`.
2. **Stem** — crude English suffix stripping so `following`, `followed` and
   `follows` all reach `follow`.
3. **Fuzzy compare** — bounded Damerau-Levenshtein, with a typo budget that
   scales with word length. Words of 3 letters or fewer must match exactly, so
   `sync` never matches `sink`, while `bandwith` still matches `bandwidth`.
4. **Pick the best** — longest match wins at each position, matches never
   overlap, and nothing matches across a sentence boundary. A single newline is
   treated as a space, since HTML wraps text wherever it likes; only a blank
   line ends a sentence.

Each phrase is replaced by a `<span class="slang-swap">` carrying *both* texts,
in `data-slang-original` and `data-slang-replacement`. That is what makes the
click toggle and the undo need nothing but the DOM — no matcher, no memory of
how the phrase was produced, and it still works after the language has been
switched out from under it. The compose box is never touched.

The click listener is delegated (one per document, not one per span) and runs on
the capture phase, so a mail client that swallows clicks does not swallow this
one. It deliberately does **not** call `preventDefault` or stop propagation: the
host app owns that click too — opening a message from the list, following a link
— and breaking that would be worse than a stray toggle. A click that ends a
drag-selection is ignored.

## Dictionary layout

The phrases being hunted are English corporate speak no matter what they get
rewritten into, so the patterns are shared and only the replacements differ:

```
src/data/phrases.js     English corporate speak   (id + patterns)
src/data/phrases-ro.js  Romanian corporate speak  (id + patterns)
src/data/slang-ro.js    id -> Romanian slang
src/data/slang-en.js    id -> English slang
src/data/packs.js       combines them for the matcher
```

Phrases are split by **source language**, which is not the same as the language
they get rewritten into. English corporate speak turns up in everybody's inbox,
so every pack needs an answer for it. Romanian corporate speak only the Romanian
pack does. A pack with no words for a phrase leaves it alone rather than
borrowing another language's joke, and a test enforces exactly that.

The Romanian list covers **two registers**, and the second one matters more:

- the formulas that still open and close a business email — `cu stimă`,
  `rămân la dispoziția dumneavoastră`, `vă mulțumesc anticipat`;
- **romgleza**, the open-plan office dialect — `face sens` (the calque of "it
  makes sense"; correct Romanian is *are sens*), `task-uri`, `deadline-ul`,
  `un call`, `customizăm`, `sharuim`, `ne focusăm`, `adresăm`, `forcastăm`.

Institutional legalese — `cu celeritate`, `facem demersuri`, `în măsura în care`
— was deliberately dropped: it belongs to letters to the town hall, not to email.

### Where the phrase lists come from

The English list is checked against published surveys of workplace jargon
(Preply, WEF, NPR — linked from the plan that produced them) rather than from
memory, which is how gaps like `culture` (the #2 most-recognised phrase) and
`new normal` (the most disliked) were found. The Romanian list has no equivalent
survey behind it, so it is assembled from Romanian writing about *romgleza*
and *corporateză*.

### Adding a phrase

Add it to `phrases.js`, then give it words in every pack:

```js
// phrases.js
{ id: 'circle-back', p: ['?(lets|let) ?us circle back', 'circling back ?on ?this'] },

// slang-ro.js
'circle-back': ['ne auzim, adică nu', 'vorbim la Paștele cailor'],

// slang-en.js
'circle-back': ["we'll never speak of this again", "let's pretend we'll talk later"],
```

Several variants per phrase stop repeated corporate tics from reading like a
find-and-replace. The pick is deterministic, so the same phrase in the same
email always gets the same joke — which also means that with two variants you
cannot be sure *which* one a given phrase gets. Where the wording matters, give
the phrase a single variant. A test fails if a pack forgets an id.

### Two rules for replacements

**1. Keep the grammar.** The replacement is dropped into the sentence where the
original stood, so it has to be the same kind of phrase. "OOO" is a state you
can be in — *"I'll be OOO next week"* — so it becomes `tolănit la soare`, an
adjectival phrase. `sunt plecat` is a whole clause and would leave the sentence
in pieces: *"I'll be sunt plecat next week"*. Same for nouns: "our cadence"
needs a noun (`ritmul întâlnirilor`), not a question (`cât de des`).

Where one entry's patterns covered both a verb and a noun — `align` and
`alignment`, `escalate` and `escalation` — they are now separate entries,
because no single replacement can be correct for both. Likewise a bare verb and
a promise: `follow up` is a verb that keeps the sentence's own subject
(*"please chase it up"*), while `(i|we) will follow up` is a whole clause and
gets a whole clause back (*"I'll nag you later"*).

Optional `let's` and `I will` prefixes were removed from verb patterns for the
same reason: a consumed prefix forced a clause-shaped replacement, which then
broke every bare use. Now the sentence keeps its own subject and modal and the
verb agrees with it (see the `*` marker above).

Replacements that precede an object are worded to precede one: `prioritize` is
*focus on* (so *"prioritize sleep"* → *"focus on sleep"*, not *"put first
sleep"*), `please find attached` is *here's*.

Romanian verbs conjugate far more than four ways, so the Romanian corporate
verbs match one conjugation each — the first-person plural the replacement is
written in (*"solicităm"* → *"cerem"*) — rather than guessing at the others.

What the type rules **cannot** catch is a word that is corporate in one sense
and ordinary in another: *"she sprints the last mile"*, *"the retro camera"*,
*"natural resources"*, *"a pop culture convention"*, *"an agile gymnast"*. Those
are handled by demanding the context that makes the corporate sense — a
determiner before `sprint`, a preposition after `align`, an object after
`leverage` — and a test runs everyday prose in both languages through the
matcher and expects nothing to fire. **Every new phrase goes through that sweep
before it is added**; it is what caught `culture of the town`, `gave 110
dollars` and `a debriefing room`.

Two candidates were dropped rather than gated, because their ordinary sense is
too plausible in an email to separate out: `lean in` (*"she leaned in and
whispered"*) and `peel the onion`. `give 110%` survives only as the spelled-out
"110 percent", because `%` is not a token and *"gave 110 dollars"* is otherwise
indistinguishable.

**2. Then be funny.** Write what somebody would actually say out loud, not a
polite gloss. "FYI" becomes `auzi ba` / `yo, listen up`, not "ca să știi și tu"
/ "for your information". A replacement that reads like a dictionary entry is
wrong even when it is correct.

### Adding a language

Copy a pack, translate the values, and register it:

```js
// src/data/packs.js
register(root.SlangPackFR || (req ? req('./slang-fr.js') : null));
```

Add the file to `manifest.json` and `popup.html`, and it shows up in the picker
with no other changes. Partial packs are fine — phrases a pack has no words for
are simply left alone.

To have it detected automatically, add its function words to
[detect.js](src/lib/detect.js). Keep out anything that also exists in another
language: `in`, `are`, `am` and `care` are all traps between English and
Romanian, and are deliberately absent from both lists.

### Pattern syntax

| Syntax | Meaning |
| --- | --- |
| `follow up` | a plain sequence of words |
| `?just checking in` | `just` is optional |
| `(lets\|let) sync` | alternatives for one slot |
| `*escalate` | the **inflecting** slot: the replacement takes this word's form |
| `=moving forward` | this **exact** word — no typo tolerance, no stemming |
| `*leverage >(our\|the)` | a **lookahead**: must be there, but stays in the text |

Alternatives are one word each — write a second pattern for a multi-word
variant. A pattern made only of optional slots is rejected at load time, as is
one with a space inside the parentheses, more than one `*` slot, or a `>` slot
that is not last.

The three markers exist for one reason: **so the replacement fits the sentence
it lands in.**

- `*` reads the form of the matched word — `escalate`, `escalating`,
  `escalated`, `escalates` — and the pack supplies a matching form:

  ```js
  'escalate': { base: ['tell the boss'], ing: ['telling the boss'],
                ed: ['told the boss'],  s: ['tells the boss'] }
  ```

  so *"she is escalating this"* becomes *"she is telling the boss this"*. The
  same `s` form gives countable nouns a plural: *"two blockers"* → *"two things
  holding everything up"*. A plain list is every form at once.
- `=` stops the stemmer from equating different words. Without it, the adverb
  `moving forward` caught the verb *"we need to move forward"*, and the noun
  in *"a lot of leverage"* caught the verb `leverages`.
- `>` supplies context without eating it. `leverage` alone is a noun as often
  as a verb; `leverage >our` is the verb, and *"our"* is still there afterwards:
  *"use our network"*, not *"use network"*.

## Tests

```
npm test        # both suites
npm run test:dom  # just the browser half
```

No dependencies. Covers normalization, the typo budget, the pattern parser and
the matcher, plus integrity checks: unique ids, no pattern owned by two
phrases, every pack covering every phrase, no pack inventing unknown ids, and a
reachability check that every pattern actually fires on the plainest sentence
it should match. The pause arithmetic is pure and tested directly, and the
popup's label tables are checked against the markup so a missing translation
fails the build instead of rendering as an empty row.

The DOM half cannot run in plain node, and a headless-browser dependency would
outweigh the extension itself — so `test/dom.html` runs in Chrome (which anyone
building a Chrome extension already has) and `test/run-dom.js` reads the results
back out of the page. It covers walking the page, skipping compose boxes and
inputs, the click toggle, the selection guard, undo on a page where some phrases
are flipped and others are not, and a single page holding an English passage, a
romgleza passage and a Romanian one — checking each is rewritten in its own
language and that the same phrase comes out differently in each. Set `CHROME_PATH` to pick a binary; the
run is skipped, not failed, if no Chrome is found.

## Layout

```
manifest.json            MV3 manifest
src/lib/normalize.js     tokenizing, stemming, casing
src/lib/fuzzy.js         edit distance + typo budget
src/lib/pattern.js       the "?optional (a|b)" DSL
src/lib/matcher.js       indexing and match selection
src/lib/dom-rewrite.js   DOM walking, swapping, undo (no chrome.* deps)
src/lib/pause.js         timed-pause arithmetic
src/lib/detect.js        which language is this, actually
src/data/               phrases + language packs
src/content/content.js   settings, MutationObserver, messaging
src/popup/              toolbar popup
tools/make-icons.js      draws the icons, no dependencies
demo/index.html          fake inbox for tuning
test/run.js              node suite
test/dom.html            browser suite, run by test/run-dom.js
```

## Roadmap

- A per-site toggle, and a "translate this page" action for non-mail pages.
- A keyboard shortcut for pause.
- Romanian verb inflection beyond the one conjugation each entry matches now.
- User-defined phrases stored in `chrome.storage.sync`.
- More languages — the pack format is the whole story.
