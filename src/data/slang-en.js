/**
 * English slang replacements, keyed by phrase id (see phrases.js).
 *
 * Same rule as the Romanian pack: say it the way a person would say it, not
 * the way a glossary would explain it. "FYI" becomes "yo, listen up".
 *
 * Several variants per phrase keep repeated tics from reading like a
 * find-and-replace; the pick is deterministic, so the same phrase in the same
 * email always gets the same joke.
 */
(function (root) {
  'use strict';

  const pack = {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    out: {
    // ---- Classics ----------------------------------------------------
    'fyi':                  ['yo, listen up'],
    'follow-up':            ['I\'ll be in your inbox again, sorry', 'I\'ll nag you later'],
    'circle-back':          [
      'we\'ll never speak of this again',
      'let\'s pretend we\'ll talk later'
    ],
    'touch-base':           ['have a quick word', 'give you a shout'],
    'per-my-last-email':    ['read the email, mate', 'it\'s all in there, scroll up'],
    'please-advise':        ['say something', 'anyone home?'],
    'moving-forward':       ['from now on', 'new rules, apparently'],
    'earliest-convenience': ['whenever you fancy', 'sometime this decade'],
    'asap':                 ['yesterday, ideally', 'now, it\'s all on fire'],
    'eod':                  ['tonight', 'knocking-off time'],
    'eow':                  ['Friday', 'Friday, in theory'],
    'checking-in':          ['you alive?', 'still nothing, then'],
    'gentle-reminder':      ['third time asking', 'me again, hi'],
    'nudge':                ['a friendly shove'],
    'any-updates':          ['anything moved?', 'is this thing breathing?'],
    'bump':                 ['up you go', 'shoving this back up'],

    // ---- Email rituals -----------------------------------------------
    'hope-well':            ['hope you\'re not dead', 'hope you\'re still breathing'],
    'apologies-delay':      ['I forgot about you', 'saw this two weeks ago, sorry'],
    'thanks-advance':       ['thanks, you\'ve no choice', 'thanks, you\'re doing it anyway'],
    'thanks-patience':      ['thanks for putting up with us'],
    'regards':              ['later', 'cheers, bye', 'peace out'],
    'looking-forward':      ['waiting, hopelessly', 'waiting till the end of time'],
    'happy-to-help':        ['I\'ve no choice, so sure', 'delighted, allegedly'],
    'hope-helps':           ['hope that\'s any use'],
    'find-attached':        ['file\'s right there', 'here it is, open it'],
    'as-discussed':         ['like we said', 'like I said on the call'],
    'as-you-know':          ['you know this already'],
    'per-usual':            ['same as always'],
    'kindly':               ['pretty please'],
    'do-the-needful':       ['just do the thing', 'crack on'],
    'lmk':                  ['tell me', 'give us a shout'],
    'thoughts':             ['what do you reckon?', 'any opinion at all?'],
    'keep-posted':          ['tell me what happens', 'keep me posted, I\'m dying here'],
    'in-the-loop':          ['in the know'],
    'loop-in':              ['dragging someone else in', 'giving them a shout too'],
    'ping-me':              ['give us a shout', 'call, text, whatever'],
    'reach-out':            ['get in touch', 'I\'ll give you a shout'],
    'heads-up':             ['fair warning', 'told you, so don\'t start'],
    'flagging':             ['raising my hand here', 'flagging this, loudly'],
    'bear-with-me':         ['hold up, yo'],
    'no-worries':           ['all good', 'no stress'],
    'sounds-good':          ['fine by me', 'that\'ll do'],
    'quick-question':       ['a quick question (it isn\'t)'],
    'tldr':                 ['short version'],

    // ---- Meetings and syncs ------------------------------------------
    'sync':                 ['a quick word over coffee', 'five minutes (one hour)'],
    'lets-connect':         ['let\'s have a word', 'let\'s actually talk'],
    'one-on-one':           ['a word in private'],
    'standup':              ['morning roll call'],
    'retro':                ['group therapy'],
    'all-hands':            ['the whole-company assembly'],
    'all-hands-deck':       ['everyone in, now'],
    'take-offline':         ['let\'s argue in private', 'a word between us two'],
    'park-it':              ['shelving this', 'into the drawer it goes'],
    'cadence':              ['how often we meet'],
    'touchpoint':           ['a word, a nudge'],
    'align':                ['agree on something', 'shake on it'],
    'same-page':            ['we get each other', 'same wavelength'],
    'level-set':            ['lower your expectations', 'let\'s get this straight'],
    'buy-in':               ['everyone nodding along', 'the bosses saying yes'],

    // ---- Big words, no content ---------------------------------------
    'synergy':              ['corporate magic', 'stuff that works together'],
    'leverage':             ['use', 'put to work'],
    'utilize':              ['use'],
    'facilitate':           ['help with'],
    'operationalize':       ['actually do'],
    'ideate':               ['think of stuff', 'a session of daft ideas'],
    'deep-dive':            ['have a proper dig', 'nose in deeper'],
    'drill-down':           ['get right into it', 'into the nitty gritty'],
    'low-hanging':          ['the easy stuff', 'whatever falls off the tree'],
    'quick-win':            ['something easy to tick off'],
    'best-practices':       ['how normal people do it', 'the done thing, apparently'],
    'outside-box':          ['have an actual idea', 'daydreaming at a whiteboard'],
    'move-needle':          ['actually change something'],
    'game-changer':         ['a proper big deal', 'life-changing (it isn\'t)'],
    'value-add':            ['something useful', 'so something good comes of it'],
    'win-win':              ['everyone wins', 'we all go home happy'],
    'paradigm-shift':       ['a whole different beast'],
    'holistic':             ['top to bottom'],
    'granular':             ['crumb by crumb', 'in tiny pieces'],
    'actionable':           ['something you can act on'],
    'boil-ocean':           ['boiling the sea, mate'],
    'table-stakes':         ['the bare minimum'],
    'north-star':           ['where we\'re pretending to go'],
    'the-ask':              ['what I actually want'],
    'learnings':            ['what we learned, if anything'],
    'next-level':           ['make it even more so'],
    'reinvent-wheel':       ['redoing what already exists'],
    'food-for-thought':     ['chew on that'],
    'brain-dump':           ['everything on my mind, unfiltered'],
    'high-level':           ['the short version', 'roughly speaking'],
    'in-the-weeds':         ['lost in the details'],
    'step-back':            ['let\'s start over'],
    'end-of-day-phrase':    ['when all\'s said and done'],
    'it-is-what-it-is':     ['nothing to be done', 'tough luck'],
    'socialize':            ['spread the word'],
    'flagpole':             ['I\'ll ask the boss and get back to you'],

    // ---- Office politics ---------------------------------------------
    'stakeholders':         ['people with opinions', 'the important ones'],
    'leadership':           ['the lot upstairs', 'the big bosses'],
    'escalate':             ['I\'m telling the boss', 'kicking this upstairs'],
    'pushback':             ['people complaining', 'grumbling'],
    'ownership':            ['your problem now', 'it\'s on you'],
    'drive-forward':        ['push the cart yourself'],
    'bring-to-table':       ['brings something to the trade'],
    'swim-lane':            ['who does what'],
    'with-respect':         ['with all due respect (there is none)'],
    'correct-me':           ['you\'re wrong, but politely'],
    'missing-something':    ['you\'re the one who\'s wrong'],
    'to-clarify':           ['to be clear'],
    'company-policy':       ['the paperwork says so'],
    'we-value':             ['we\'re pretending to care'],
    'restructuring':        ['cutting to the bone'],
    'layoffs':              ['sacking people'],
    'onboarding':           ['putting them to work'],
    'offboarding':          ['showing them the door'],
    'headcount':            ['people', 'people and money'],

    // ---- The actual work ---------------------------------------------
    'bandwidth':            ['time and will to live', 'time and nerves'],
    'no-bandwidth':         ['I\'m out of hours and patience', 'neither the time nor the will'],
    'action-items':         ['what we have to do', 'who does what'],
    'deliverables':         ['the stuff we owe'],
    'blocker':              ['the thing holding everything up'],
    'blocked':              ['I\'m sat here doing nothing'],
    'backlog':              ['the pile of jobs'],
    'sprint':               ['the two-week dash'],
    'mvp':                  ['the barely-working version'],
    'poc':                  ['a thing duct-taped together'],
    'tech-debt':            ['the mess under the rug'],
    'nice-to-have':         ['if there\'s time (there won\'t be)'],
    'must-have':            ['non-negotiable', 'set in stone'],
    'prioritize':           ['put first'],
    'deprioritize':         ['shove in a drawer'],
    'on-my-radar':          ['I know about it'],
    'single-source':        ['the one place that\'s right'],
    'roadmap':              ['the plan on paper'],
    'eta':                  ['when\'s it done?'],
    'ballpark':             ['roughly, give or take'],
    'mission-critical':     ['the world ends without it'],
    'top-priority':         ['the most urgent (like everything else)'],
    'urgent':               ['urgent (as always)'],
    'fire-drill':           ['everyone panic'],

    // ---- Away and hours ----------------------------------------------
    'ooo':                  ['gone, don\'t look for me'],
    'pto':                  ['on holiday, mate'],
    'wfh':                  ['home, in my pyjamas'],
    }
  };

  root.SlangPackEN = pack;
  if (typeof module !== 'undefined' && module.exports) module.exports = pack;
})(typeof globalThis !== 'undefined' ? globalThis : this);
