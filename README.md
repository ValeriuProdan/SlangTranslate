# Slang Translate

A Chrome extension that reads the email you are looking at and quietly rewrites
corporate speak into something a human would say. Romanian slang or plain-spoken
English — your pick.

> **FYI, as per my last email, I will follow up before EOD.**

**Română:** Ca să știi și tu, cum ziceam, dar se pare că n-ai citit, îți dau io
un semn... poate până se închide prăvălia.

**English:** Heads up, since nobody else told you, read the email I already sent
you, expect me in your inbox again before knocking-off time.

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
the popup has the language picker, the on/off switch, the typo tolerance, and
the list of what it caught. The popup speaks whichever language you are
translating into.

Hover any rewritten phrase to see the corporate original.

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

Each phrase is replaced by a `<span class="slang-swap">` carrying the original
in a `data-slang-original` attribute, so every rewrite is reversible — undo
needs nothing but the DOM — and the compose box is never touched.

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
'circle-back': ['ne auzim noi cândva', 'revenim noi... probabil'],

// slang-en.js
'circle-back': ["we'll never speak of this again", "let's pretend we'll talk later"],
```

Several variants per phrase stop repeated corporate tics from reading like a
find-and-replace. The pick is deterministic, so the same phrase in the same
email always gets the same joke. A test fails if a pack forgets an id.

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
npm test
```

No dependencies. Covers normalization, the typo budget, the pattern parser and
the matcher, plus integrity checks: unique ids, no pattern owned by two
phrases, every pack covering every phrase, no pack inventing unknown ids, and a
reachability check that every pattern actually fires on the plainest sentence
it should match.

## Layout

```
manifest.json            MV3 manifest
src/lib/normalize.js     tokenizing, stemming, casing
src/lib/fuzzy.js         edit distance + typo budget
src/lib/pattern.js       the "?optional (a|b)" DSL
src/lib/matcher.js       indexing and match selection
src/lib/dom-rewrite.js   DOM walking, swapping, undo (no chrome.* deps)
src/data/               phrases + language packs
src/content/content.js   settings, MutationObserver, messaging
src/popup/              toolbar popup
tools/make-icons.js      draws the icons, no dependencies
demo/index.html          fake inbox for tuning
```

## Roadmap

- A per-site toggle, and a "translate this page" action for non-mail pages.
- User-defined phrases stored in `chrome.storage.sync`.
- More languages — the pack format is the whole story.
