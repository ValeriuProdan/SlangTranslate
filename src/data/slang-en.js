/**
 * English slang replacements, keyed by phrase id (see phrases.js).
 *
 * Same jokes, different language: the corporate phrase is translated into
 * what the sender actually meant. Several variants per phrase keep repeated
 * tics from reading like a find-and-replace; the pick is deterministic, so
 * the same phrase in the same email always gets the same joke.
 */
(function (root) {
  'use strict';

  const pack = {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    out: {
    // ---- Classics ----------------------------------------------------
    'fyi':                  ['just so you know', 'heads up, since nobody else told you'],
    'follow-up':            ['I\'ll nag you about this later', 'expect me in your inbox again'],
    'circle-back':          [
      'we\'ll never speak of this again',
      'let\'s pretend we\'ll talk later'
    ],
    'touch-base':           ['have a quick word', 'give you a shout'],
    'per-my-last-email':    [
      'read the email I already sent you',
      'scroll down, it\'s all in there'
    ],
    'please-advise':        ['say something, anything', 'answer me, would you'],
    'moving-forward':       ['from now on', 'starting now'],
    'earliest-convenience': ['whenever you feel like it', 'sometime this decade'],
    'asap':                 ['yesterday would\'ve been nice', 'right now, everything\'s on fire'],
    'eod':                  ['tonight', 'knocking-off time'],
    'eow':                  ['Friday', 'Friday, allegedly'],
    'checking-in':          ['you\'re not dead, are you?', 'still nothing? cool'],
    'gentle-reminder':      ['third time asking, politely', 'hey, still nothing?'],
    'nudge':                ['a poke in the ribs'],
    'any-updates':          ['has anything moved?', 'is this thing still alive?'],
    'bump':                 ['up you go', 'shoving this back to the top'],

    // ---- Email rituals -----------------------------------------------
    'hope-well':            ['hope you\'re not dead yet', 'hope you\'re still breathing'],
    'apologies-delay':      ['I forgot about you, sorry', 'I saw this two weeks ago'],
    'thanks-advance':       [
      'thanks, since you\'re doing it anyway',
      'thanks in advance, no takebacks'
    ],
    'thanks-patience':      ['thanks for putting up with us'],
    'regards':              ['later', 'cheers, bye', 'corporate hugs'],
    'looking-forward':      ['waiting, hopelessly', 'waiting, whenever, no rush apparently'],
    'happy-to-help':        ['I\'ve no choice, so sure', 'with pleasure (he says)'],
    'hope-helps':           ['hope that\'s any use to you'],
    'find-attached':        ['the file\'s right there', 'here\'s the file, read it'],
    'as-discussed':         ['like we said', 'like I said on the call'],
    'as-you-know':          ['you know this already'],
    'per-usual':            ['same as always'],
    'kindly':               ['pretty please'],
    'do-the-needful':       ['just do the thing'],
    'lmk':                  ['tell me', 'give us a shout'],
    'thoughts':             ['what do you reckon?', 'any opinion at all?'],
    'keep-posted':          ['tell me what happens', 'keep me posted, I\'m dying here'],
    'in-the-loop':          ['in the know'],
    'loop-in':              ['dragging someone else into this', 'giving them a shout too'],
    'ping-me':              ['give us a shout', 'call, text, anything'],
    'reach-out':            ['get in touch', 'give you a shout'],
    'heads-up':             ['fair warning', 'telling you early so you can\'t complain'],
    'flagging':             ['raising my hand here'],
    'bear-with-me':         ['hang on a sec'],
    'no-worries':           ['all good, mate', 'no stress'],
    'sounds-good':          ['fine by me', 'that\'ll do'],
    'quick-question':       ['a quick question (it\'s not quick)'],
    'tldr':                 ['short version'],

    // ---- Meetings and syncs ------------------------------------------
    'sync':                 ['a quick word over coffee', 'five minutes (one hour)'],
    'lets-connect':         ['let\'s have a word', 'let\'s actually talk'],
    'one-on-one':           ['a word in private'],
    'standup':              ['morning roll call'],
    'retro':                ['the group therapy session'],
    'all-hands':            ['the whole-company assembly'],
    'all-hands-deck':       ['everyone in, now'],
    'take-offline':         ['let\'s argue in private', 'a word between us two'],
    'park-it':              ['shelving this for another day', 'into the drawer it goes'],
    'cadence':              ['how often we meet'],
    'touchpoint':           ['a word, a nudge'],
    'align':                ['agree on something', 'shake on it'],
    'same-page':            ['we get each other', 'we speak the same language'],
    'level-set':            ['lower your expectations', 'let\'s get this straight up front'],
    'buy-in':               ['everyone nodding along', 'the bosses saying yes'],

    // ---- Big words, no content ---------------------------------------
    'synergy':              ['stuff that works together', 'corporate magic'],
    'leverage':             ['use', 'put to work'],
    'utilize':              ['use'],
    'facilitate':           ['help with'],
    'operationalize':       ['actually do'],
    'ideate':               ['think of stuff', 'a session of daft ideas'],
    'deep-dive':            ['have a proper dig', 'stick our nose in deeper'],
    'drill-down':           ['get right into it', 'into the nitty gritty'],
    'low-hanging':          ['the easy stuff', 'the fruit on the low branch'],
    'quick-win':            ['something easy to tick off'],
    'best-practices':       ['how normal people do it', 'the done thing, apparently'],
    'outside-box':          ['have an actual idea', 'daydreaming at a whiteboard'],
    'move-needle':          ['actually change something'],
    'game-changer':         ['a proper big deal', 'life-changing (it isn\'t)'],
    'value-add':            ['something useful', 'so something good comes of it'],
    'win-win':              ['everyone gets something', 'we all go home happy'],
    'paradigm-shift':       ['a whole different beast'],
    'holistic':             ['top to bottom'],
    'granular':             ['in tiny pieces', 'crumb by crumb'],
    'actionable':           ['something you can act on'],
    'boil-ocean':           ['boiling the sea, mate'],
    'table-stakes':         ['the bare minimum'],
    'north-star':           ['where we\'re trying to get to'],
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
    'it-is-what-it-is':     ['nothing to be done about it'],
    'socialize':            ['spread the word'],
    'flagpole':             ['I\'ll ask the boss and get back to you'],

    // ---- Office politics ---------------------------------------------
    'stakeholders':         ['people with opinions', 'the important people'],
    'leadership':           ['the lot upstairs', 'the big bosses'],
    'escalate':             ['I\'m telling the boss', 'kicking up a fuss higher up'],
    'pushback':             ['people complaining', 'grumbling'],
    'ownership':            ['you deal with it', 'it\'s on you'],
    'drive-forward':        ['push the cart yourself'],
    'bring-to-table':       ['brings something to the trade'],
    'swim-lane':            ['who does what'],
    'with-respect':         ['with all due respect (there is none)'],
    'correct-me':           ['you\'re wrong, but politely'],
    'missing-something':    ['you\'re definitely the one who\'s wrong'],
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
    'no-bandwidth':         ['I\'ve neither the time nor the will', 'I\'m out of hours and patience'],
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
    'wfh':                  ['working from home (in my pyjamas)'],
    }
  };

  root.SlangPackEN = pack;
  if (typeof module !== 'undefined' && module.exports) module.exports = pack;
})(typeof globalThis !== 'undefined' ? globalThis : this);
