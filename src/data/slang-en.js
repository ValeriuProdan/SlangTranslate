/**
 * English slang, keyed by phrase id (see phrases.js).
 *
 * Two rules, in this order:
 *
 * 1. Keep the grammar. A replacement is dropped into the sentence where the
 *    original stood, so it must fit what comes before and after it. Verbs are
 *    given as { base, ing, ed, s } and the matcher picks the form of the word it
 *    actually found: "escalating" becomes "telling the boss". The same s form
 *    gives countable nouns their plural. Nouns stay nouns, states stay states.
 * 2. Then be funny. Write what somebody would say out loud, not a glossary
 *    entry: "yo, listen up", never "for your information".
 *
 * Romanian corporate speak is deliberately not covered here -- nobody writes it
 * in an English thread, and an uncovered phrase is simply left alone.
 */
(function (root) {
  'use strict';

  const pack = {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    out: {
    // ---- Classics ------------------------------------------------------
    'fyi':                    ['yo, listen up'],
    'follow-up': {
      base: ['chase it up'],
      ing: ['chasing it up'],
      ed: ['chased it up'],
      s: ['chases it up']
    },
    'will-follow-up':         ['I\'ll nag you later', 'I\'ll be in your inbox again, sorry'],
    'circle-back': {
      base: ['come back to it, maybe'],
      ing: ['coming back to it, maybe'],
      ed: ['came back to it, maybe'],
      s: ['comes back to it, maybe']
    },
    'circle-back-promise':    [
      'we\'ll never speak of this again',
      'let\'s pretend we\'ll talk later'
    ],
    'close-the-loop': {
      base: ['finish the thread'],
      ing: ['finishing the thread'],
      ed: ['finished the thread'],
      s: ['finishes the thread']
    },
    'touch-base': {
      base: ['have a quick word'],
      ing: ['having a quick word'],
      ed: ['had a quick word'],
      s: ['has a quick word']
    },
    'per-my-last-email':      ['read the email, mate', 'it\'s all in there, scroll up'],
    'please-advise':          ['say something', 'anyone home?'],
    'moving-forward':         ['from now on'],
    'earliest-convenience':   ['whenever you fancy', 'sometime this decade'],
    'asap':                   ['yesterday, ideally', 'now, it\'s all on fire'],
    'eod':                    ['tonight', 'knocking-off time'],
    'eow':                    ['Friday', 'Friday, in theory'],
    'checking-in':            ['you alive?', 'still nothing, then'],
    'gentle-reminder':        ['third time asking', 'me again, hi'],
    'nudge':                  ['a friendly shove'],
    'any-updates':            ['anything moved?', 'is this thing breathing?'],
    'bump':                   ['up you go', 'shoving this back up'],

    // ---- Email rituals -------------------------------------------------
    'hope-well':              ['hope you\'re not dead', 'hope you\'re still breathing'],
    'apologies-delay':        ['I forgot about you', 'saw this two weeks ago, sorry'],
    'thanks-advance':         ['thanks, you\'ve no choice', 'thanks, you\'re doing it anyway'],
    'thanks-patience':        ['thanks for putting up with us'],
    'regards':                ['later', 'cheers, bye', 'peace out'],
    'looking-forward':        ['waiting, hopelessly', 'waiting till the end of time'],
    'happy-to-help':          ['stuck helping, apparently'],
    'hope-helps':             ['hope that\'s any use'],
    'find-attached':          ['here\'s'],
    'as-discussed':           ['like we said', 'like I said on the call'],
    'as-you-know':            ['you know this already'],
    'per-usual':              ['same as always'],
    'kindly':                 ['pretty please'],
    'do-the-needful':         ['just do the thing', 'crack on'],
    'lmk':                    ['tell me', 'give us a shout'],
    'thoughts':               ['your take'],
    'keep-posted':            ['tell me what happens', 'keep me posted, I\'m dying here'],
    'in-the-loop':            ['in the know'],
    'loop-in': {
      base: ['rope in'],
      ing: ['roping in'],
      ed: ['roped in'],
      s: ['ropes in']
    },
    'ping-me':                ['give us a shout', 'call, text, whatever'],
    'reach-out': {
      base: ['get in touch'],
      ing: ['getting in touch'],
      ed: ['got in touch'],
      s: ['gets in touch']
    },
    'heads-up':               ['fair warning', 'told you, so don\'t start'],
    'flagging':               ['raising my hand here', 'flagging this, loudly'],
    'bear-with-me':           ['hold up, yo'],
    'no-worries':             ['all good', 'no stress'],
    'sounds-good':            ['fine by me', 'that\'ll do'],
    'quick-question':         ['a quick question (it isn\'t)'],
    'sanity-check':           ['a quick look to see if this is mad'],
    'tldr':                   ['short version'],

    // ---- Meetings and syncs --------------------------------------------
    'sync':                   ['a quick word over coffee', 'five minutes (one hour)'],
    'sync-up': {
      base: ['have a quick word'],
      ing: ['having a quick word'],
      ed: ['had a quick word'],
      s: ['has a quick word']
    },
    'lets-sync':              ['let\'s have a quick word', 'let\'s do five minutes (an hour)'],
    'lets-connect':           ['let\'s have a word', 'let\'s actually talk'],
    'hop-on-call': {
      base: ['have a word'],
      ing: ['having a word'],
      ed: ['had a word'],
      s: ['has a word']
    },
    'quick-call':             ['a call that eats an hour'],
    'one-on-one':             ['a word in private'],
    'standup':                ['morning roll call'],
    'retro':                  ['group therapy'],
    'debrief-noun':           ['recap'],
    'debrief': {
      base: ['go over it'],
      ed: ['went over it'],
      s: ['goes over it']
    },
    'all-hands':              ['the whole-company assembly'],
    'all-hands-deck':         ['everyone in, now'],
    'take-offline': {
      base: ['argue in private'],
      ing: ['arguing in private'],
      ed: ['argued in private'],
      s: ['argues in private']
    },
    'park-it': {
      base: ['shelve it', 'kick it down the road'],
      ing: ['shelving it', 'kicking it down the road'],
      ed: ['shelved it', 'kicked it down the road'],
      s: ['shelves it', 'kicks it down the road']
    },
    'table-this': {
      base: ['drop it for now'],
      ing: ['dropping it for now'],
      ed: ['dropped it for now'],
      s: ['drops it for now']
    },
    'cadence':                ['the meeting rhythm'],
    'touchpoint':             ['a word, a nudge'],
    'align': {
      base: ['agree'],
      ing: ['agreeing'],
      ed: ['agreed'],
      s: ['agrees']
    },
    'lets-align':             ['let\'s agree, for once'],
    'alignment':              ['an agreement'],
    'same-page':              ['on the same wavelength'],
    'level-set': {
      base: ['lower your expectations'],
      ing: ['lowering your expectations'],
      ed: ['lowered your expectations'],
      s: ['lowers your expectations']
    },
    'buy-in':                 ['everyone nodding along', 'the bosses saying yes'],
    'reach-consensus': {
      base: ['get everyone nodding'],
      ing: ['getting everyone nodding'],
      ed: ['got everyone nodding'],
      s: ['gets everyone nodding']
    },

    // ---- Big words, no content -----------------------------------------
    'synergy':                ['corporate magic', 'stuff that works together'],
    'leverage': {
      base: ['use'],
      ing: ['using'],
      ed: ['used'],
      s: ['uses']
    },
    'utilize': {
      base: ['use'],
      ing: ['using'],
      ed: ['used'],
      s: ['uses']
    },
    'facilitate': {
      base: ['help with'],
      ing: ['helping with'],
      ed: ['helped with'],
      s: ['helps with']
    },
    'operationalize': {
      base: ['actually do'],
      ing: ['actually doing'],
      ed: ['actually did'],
      s: ['actually does']
    },
    'ideate': {
      base: ['think of stuff'],
      ing: ['thinking of stuff'],
      ed: ['thought of stuff'],
      s: ['thinks of stuff']
    },
    'ideation':               ['a session of daft ideas'],
    'deep-dive':              ['a proper dig'],
    'dive-deep': {
      base: ['dig properly'],
      ing: ['digging properly'],
      ed: ['dug properly'],
      s: ['digs properly']
    },
    'drill-down': {
      base: ['get right into it'],
      ing: ['getting right into it'],
      ed: ['got right into it'],
      s: ['gets right into it']
    },
    'low-hanging':            ['the easy stuff', 'whatever falls off the tree'],
    'pain-points': {
      base: ['thing that hurts'],
      s: ['things that hurt']
    },
    'quick-win': {
      base: ['easy tick'],
      s: ['easy ticks']
    },
    'best-practices':         ['how normal people do it', 'the done thing, apparently'],
    'best-in-class':          ['unbeatable, apparently'],
    'agile':                  ['bendy, allegedly'],
    'culture':                ['the vibe, allegedly'],
    'outside-box': {
      base: ['have an actual idea'],
      ing: ['having an actual idea'],
      ed: ['had an actual idea'],
      s: ['has an actual idea']
    },
    'blue-sky':               ['daydreaming at a whiteboard'],
    'move-needle': {
      base: ['actually change something'],
      ing: ['actually changing something'],
      ed: ['actually changed something'],
      s: ['actually changes something']
    },
    'move-goalposts': {
      base: ['change the rules halfway'],
      ing: ['changing the rules halfway'],
      ed: ['changed the rules halfway'],
      s: ['changes the rules halfway']
    },
    'game-changer':           ['a proper big deal', 'life-changing (it isn\'t)'],
    'value-add':              ['something useful'],
    'value-prop':             ['reason to care, allegedly'],
    'add-value': {
      base: ['be useful'],
      ing: ['being useful'],
      ed: ['been useful'],
      s: ['is useful']
    },
    'win-win':                ['everyone wins', 'we all go home happy'],
    'paradigm-shift':         ['a whole different beast'],
    'new-normal':             ['how it is now, apparently'],
    'bau':                    ['the usual grind'],
    'holistic':               ['top to bottom'],
    'granular':               ['crumb by crumb', 'in tiny pieces'],
    'actionable':             ['something you can act on'],
    'boil-ocean': {
      base: ['boil the sea, mate'],
      ing: ['boiling the sea, mate'],
      ed: ['boiled the sea, mate'],
      s: ['boils the sea, mate']
    },
    'herding-cats':           ['a shambles'],
    'table-stakes':           ['the bare minimum'],
    'boots-on-ground':        ['actual people doing actual work'],
    'give-110': {
      base: ['do the impossible'],
      ing: ['doing the impossible'],
      ed: ['did the impossible'],
      s: ['does the impossible']
    },
    'north-star':             ['the big target'],
    'the-ask':                ['what I actually want'],
    'learnings':              ['what we learned, if anything'],
    'next-level': {
      base: ['make it even more so'],
      ing: ['making it even more so'],
      ed: ['made it even more so'],
      s: ['makes it even more so']
    },
    'next-level-adj':         ['a bit much'],
    'reinvent-wheel': {
      base: ['redo what already exists'],
      ing: ['redoing what already exists'],
      ed: ['redid what already exists'],
      s: ['redoes what already exists']
    },
    'food-for-thought':       ['something to chew on'],
    'brain-dump':             ['everything on my mind, unfiltered'],
    'high-level':             ['the short version', 'roughly speaking'],
    'at-scale':               ['when it is huge'],
    'in-the-weeds':           ['lost in the details'],
    'step-back': {
      base: ['start over'],
      ing: ['starting over'],
      ed: ['started over'],
      s: ['starts over']
    },
    'end-of-day-phrase':      ['when all\'s said and done'],
    'it-is-what-it-is':       ['nothing to be done', 'tough luck'],
    'socialize': {
      base: ['hawk around'],
      ing: ['hawking around'],
      ed: ['hawked around'],
      s: ['hawks around']
    },
    'flagpole': {
      base: ['ask the boss'],
      ing: ['asking the boss'],
      ed: ['asked the boss'],
      s: ['asks the boss']
    },

    // ---- Office politics -----------------------------------------------
    'stakeholders': {
      base: ['person with opinions'],
      s: ['people with opinions']
    },
    'leadership':             ['the lot upstairs', 'the big bosses'],
    'escalate': {
      base: ['tell the boss'],
      ing: ['telling the boss'],
      ed: ['told the boss'],
      s: ['tells the boss']
    },
    'escalation':             ['a complaint upstairs'],
    'pushback':               ['grumbling'],
    'push-back': {
      base: ['complain'],
      ing: ['complaining'],
      ed: ['complained'],
      s: ['complains']
    },
    'ownership':              ['the hot potato'],
    'take-ownership': {
      base: ['take the hit'],
      ing: ['taking the hit'],
      ed: ['took the hit'],
      s: ['takes the hit']
    },
    'drive-forward': {
      base: ['push the cart'],
      ing: ['pushing the cart'],
      ed: ['pushed the cart'],
      s: ['pushes the cart']
    },
    'bring-to-table': {
      base: ['actually offer'],
      ing: ['actually offering'],
      ed: ['actually offered'],
      s: ['actually offers']
    },
    'swim-lane':              ['who does what'],
    'cross-functional':       ['mixed-up'],
    'with-respect':           ['with all due respect (there is none)'],
    'correct-me':             ['you\'re wrong, but politely'],
    'missing-something':      ['you\'re the one who\'s wrong'],
    'to-clarify':             ['to be clear'],
    'company-policy':         ['the paperwork says so'],
    'we-value':               ['we\'re pretending to care'],
    'restructuring':          ['cutting to the bone'],
    'layoffs':                ['sacking people'],
    'onboarding':             ['putting them to work'],
    'onboard': {
      base: ['break in'],
      ing: ['breaking in'],
      ed: ['broke in'],
      s: ['breaks in']
    },
    'offboarding':            ['showing them the door'],
    'offboard': {
      base: ['kick out'],
      ing: ['kicking out'],
      ed: ['kicked out'],
      s: ['kicks out']
    },
    'headcount':              ['people', 'people and money'],

    // ---- The actual work -----------------------------------------------
    'bandwidth':              ['time and will to live', 'time and nerves'],
    'no-bandwidth':           ['I\'m out of hours and patience', 'neither the time nor the will'],
    'action-items': {
      base: ['thing to do'],
      s: ['things to do']
    },
    'deliverables': {
      base: ['thing we owe'],
      s: ['stuff we owe']
    },
    'blocker': {
      base: ['thing holding everything up'],
      s: ['things holding everything up']
    },
    'blocked':                ['I\'m sat here doing nothing'],
    'backlog':                ['pile of jobs'],
    'sprint':                 ['the two-week dash'],
    'mvp':                    ['the barely-working version'],
    'poc':                    ['a thing duct-taped together'],
    'tech-debt':              ['the mess under the rug'],
    'nice-to-have':           ['if there\'s time (there won\'t be)'],
    'must-have':              ['non-negotiable', 'set in stone'],
    'prioritize': {
      base: ['focus on'],
      ing: ['focusing on'],
      ed: ['focused on'],
      s: ['focuses on']
    },
    'priorities':             ['things that matter, apparently'],
    'deprioritize': {
      base: ['quietly drop'],
      ing: ['quietly dropping'],
      ed: ['quietly dropped'],
      s: ['quietly drops']
    },
    'on-my-radar':            ['on my list'],
    'single-source':          ['the one place that\'s right'],
    'kpi': {
      base: ['number they judge you by'],
      s: ['numbers they judge you by']
    },
    'okr': {
      base: ['goal nobody hits'],
      s: ['goals nobody hits']
    },
    'roadmap':                ['the plan on paper'],
    'runway':                 ['cash left'],
    'eta':                    ['the supposed finish time'],
    'tbd':                    ['nobody knows yet'],
    'ballpark':               ['a number off the top of my head'],
    'mission-critical':       ['the world ends without it'],
    'top-priority': {
      base: ['most urgent thing (like everything else)'],
      s: ['most urgent things (like everything else)']
    },
    'urgent':                 ['urgent (as always)'],
    'fire-drill':             ['everyone panic'],

    // ---- Away and hours ------------------------------------------------
    'ooo':                    ['off sunning myself', 'gone fishing'],
    'pto':                    ['holiday'],
    'wfh':                    ['home, in my pyjamas'],
    }
  };

  root.SlangPackEN = pack;
  if (typeof module !== 'undefined' && module.exports) module.exports = pack;
})(typeof globalThis !== 'undefined' ? globalThis : this);
