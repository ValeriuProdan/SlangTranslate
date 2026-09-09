# Slang Translate

A Chrome extension that reads the email you are looking at and quietly rewrites
corporate speak into something a human would say. Romanian slang or plain-spoken
English — your pick.

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
src/data/phrases.js    id + patterns          (shared source side)
src/data/slang-ro.js   id -> Romanian slang
src/data/slang-en.js   id -> English slang
src/data/packs.js      combines them for the matcher
```

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

**The voice matters more than the accuracy.** Write what somebody would
actually say out loud, not a polite gloss of what the corporate phrase means.
"FYI" becomes `auzi ba` / `yo, listen up`, not "ca să știi și tu" / "for your
information". If a replacement reads like a dictionary entry, it is wrong even
when it is correct.

### Adding a language

Copy a pack, translate the values, and register it:

```js
// src/data/packs.js
register(root.SlangPackFR || (req ? req('./slang-fr.js') : null));
```

Add the file to `manifest.json` and `popup.html`, and it shows up in the picker
with no other changes. Partial packs are fine — phrases a pack has no words for
are simply left alone.

### Pattern syntax

| Syntax | Meaning |
| --- | --- |
| `follow up` | a plain sequence of words |
| `?just checking in` | `just` is optional |
| `(lets\|let) sync` | alternatives for one slot |
| `?(i\|we) ?(will\|ll) follow up` | both combined |

Alternatives are one word each — write a second pattern for a multi-word
variant. A pattern made only of optional slots is rejected at load time, as is
one with a space inside the parentheses.

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
inputs, the click toggle, the selection guard, and undo on a page where some
phrases are flipped and others are not. Set `CHROME_PATH` to pick a binary; the
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
- User-defined phrases stored in `chrome.storage.sync`.
- More languages — the pack format is the whole story.
