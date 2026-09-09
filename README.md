# Slang Translate

A Chrome extension that reads the email you are looking at and quietly rewrites
corporate speak into Romanian slang.

> **FYI, as per my last email, I will follow up before EOD.**
>
> becomes
>
> **Ca să știi și tu, cum ziceam, dar se pare că n-ai citit, te sun io dacă e până diseară.**

Everything happens locally in the tab. No network calls, no accounts, no
telemetry — the extension cannot send your mail anywhere because it never talks
to anything.

## Install (unpacked)

1. `git clone` this repo
2. open `chrome://extensions`
3. turn on **Developer mode** (top right)
4. **Load unpacked** → pick this folder

It activates on Gmail, Outlook (web), Yahoo Mail, Proton Mail, Fastmail and
Zoho Mail. The toolbar badge shows how many phrases were swapped on the page;
the popup has the on/off switch, the typo tolerance, and the list of what it
caught.

Hover any rewritten phrase to see the corporate original.

## Try it without installing

```
open demo/index.html
```

A fake inbox that loads the real matching code straight from `src/`. Good for
tuning the dictionary — edit, reload, done.

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
   overlap, and nothing matches across a sentence boundary.

Each phrase is replaced by a `<span class="slang-swap">` that carries the
original in a `data-slang-original` attribute, so every rewrite is reversible
and the compose box is never touched.

## Adding phrases

Entries live in [`src/data/dictionary-ro.js`](src/data/dictionary-ro.js):

```js
{ id: 'circle-back',
  p: ['?(lets|let) ?us circle back', 'circling back ?on ?this'],
  ro: ['ne auzim noi cândva', 'revenim noi... probabil'] }
```

- `id` — unique slug, also the seed for choosing between variants
- `p` — patterns in the small DSL below
- `ro` — one or more replacements; the pick is deterministic, so the same
  phrase in the same email always gets the same joke

### Pattern DSL

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
the matcher, plus dictionary integrity: unique ids, no pattern owned by two
entries, and a reachability check that every pattern actually fires on the
plainest sentence it should match.

## Layout

```
manifest.json            MV3 manifest
src/lib/normalize.js     tokenizing, stemming, casing
src/lib/fuzzy.js         edit distance + typo budget
src/lib/pattern.js       the "?optional (a|b)" DSL
src/lib/matcher.js       indexing and match selection
src/lib/dom-rewrite.js   DOM walking, swapping, undo (no chrome.* deps)
src/data/dictionary-ro.js
src/content/content.js   settings, MutationObserver, messaging
src/popup/              toolbar popup
tools/make-icons.js      draws the icons, no dependencies
demo/index.html          fake inbox for tuning
```

## Roadmap

- **English slang pack.** The matcher already takes a dictionary object; v2
  adds `dictionary-en.js` and a language picker in the popup.
- A per-site toggle, and an "translate this page" action for non-mail pages.
- User-defined phrases stored in `chrome.storage.sync`.
