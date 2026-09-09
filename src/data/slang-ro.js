/**
 * Romanian slang replacements, keyed by phrase id (see phrases.js).
 *
 * The register is the street, not the dictionary: what someone would actually
 * say out loud, not a polite gloss of what the corporate phrase means. "FYI"
 * becomes "auzi ba", never "ca sa stii si tu".
 *
 * Several variants per phrase keep repeated corporate tics from reading like
 * a find-and-replace; the pick is deterministic, so the same phrase in the
 * same email always gets the same joke.
 */
(function (root) {
  'use strict';

  const pack = {
    id: 'ro',
    label: 'Romana',
    nativeLabel: 'Rom\u00e2n\u0103',
    out: {
    // ---- Clasicele ---------------------------------------------------
    'fyi':                  ['auzi ba'],
    'follow-up':            ['te sun io, dacă-mi arde', 'îți dau bip, poate'],
    'circle-back':          ['ne auzim, adică nu', 'vorbim la Paștele cailor'],
    'touch-base':           ['dăm un bip', 'ne vedem la o bere'],
    'per-my-last-email':    ['citește, bă, mailul', 'ți-am scris, deschide ochii'],
    'please-advise':        ['zi ceva, bă', 'ai amuțit?'],
    'moving-forward':       ['de-acu-ncolo', 'gata, altă viață'],
    'earliest-convenience': ['când te-o tăia capul', 'când oi avea chef'],
    'asap':                 ['ieri, bă', 'acu, că ard toate'],
    'eod':                  ['până diseară', 'până pleacă lumea acasă'],
    'eow':                  ['până vineri', 'până vineri, teoretic'],
    'checking-in':          ['mai trăiești?', 'ai murit acolo?'],
    'gentle-reminder':      ['a treia oară, bă', 'iar eu, tot eu'],
    'nudge':                ['un ghiont prietenesc'],
    'any-updates':          ['s-a mișcat ceva?', 'mai suflă?'],
    'bump':                 ['sus, bă', 'sus cu el, că s-a-necat'],

    // ---- Ritualuri de mail -------------------------------------------
    'hope-well':            ['sper că mai trăiești', 'sper că n-ai murit'],
    'apologies-delay':      ['am uitat de tine', 'l-am văzut acu două săptămâni'],
    'thanks-advance':       ['mersi, că n-ai scăpare', 'mersi, că oricum o faci'],
    'thanks-patience':      ['mersi că înghiți'],
    'regards':              ['pa', 'te pup', 'salut și la revedere'],
    'looking-forward':      ['aștept până la Paștele cailor', 'aștept, fără speranțe'],
    'happy-to-help':        ['n-am ce face, te ajut', 'cu drag, chipurile'],
    'hope-helps':           ['sper că-ți folosește la ceva'],
    'find-attached':        ['ți-am pus fișieru acolo', 'uite-l, deschide-l'],
    'as-discussed':         ['cum am zis', 'cum ziceam la telefon'],
    'as-you-know':          ['știi tu bine'],
    'per-usual':            ['ca de obicei'],
    'kindly':               ['te rog frumos'],
    'do-the-needful':       ['bagă, bă', 'fă și tu ce trebuie'],
    'lmk':                  ['zi-mi și mie', 'dă-mi bip'],
    'thoughts':             ['ce zici, bă?', 'tu ce zici?'],
    'keep-posted':          ['zi-mi ce mai e', 'ține-mă la curent, că mor'],
    'in-the-loop':          ['la curent'],
    'loop-in':              ['îl bag și pe el', 'îi dau și lui bip'],
    'ping-me':              ['dă-mi bip', 'sună, scrie, ceva'],
    'reach-out':            ['dau io un semn', 'te caut io'],
    'heads-up':             ['ia aminte', 'te-am prevenit, să nu zici'],
    'flagging':             ['trag un semnal', 'atenție aici'],
    'bear-with-me':         ['stai bre un pic'],
    'no-worries':           ['lasă, frate', 'n-ai griji'],
    'sounds-good':          ['merge', 'e ok, bă'],
    'quick-question':       ['o întrebare scurtă (nu e scurtă)'],
    'tldr':                 ['pe scurt, bă'],

    // ---- Sedinte si sincronizari -------------------------------------
    'sync':                 ['o vorbă la cafea', 'cinci minute (o oră)'],
    'lets-connect':         ['hai să dăm o vorbă', 'hai să ne auzim'],
    'one-on-one':           ['o vorbă în doi'],
    'standup':              ['raportul de dimineață'],
    'retro':                ['ședința de plâns'],
    'all-hands':            ['adunarea'],
    'all-hands-deck':       ['toată lumea la treabă'],
    'take-offline':         ['vorbim între patru ochi', 'vorbim noi separat'],
    'park-it':              ['băgăm la sertar', 'lăsăm pe altă dată'],
    'cadence':              ['cât de des'],
    'touchpoint':           ['o vorbă, un bip'],
    'align':                ['hai să ne-nțelegem', 'batem palma'],
    'same-page':            ['ne-am înțeles', 'vorbim aceeași limbă'],
    'level-set':            ['nu-ți face speranțe', 'să ne lămurim de la-nceput'],
    'buy-in':               ['să zică și șefii da', 'să fie toți de acord'],

    // ---- Vorbe mari, continut zero -----------------------------------
    'synergy':              ['magie corporatistă', 'chestii care merg împreună'],
    'leverage':             ['ne folosim de', 'punem la treabă'],
    'utilize':              ['folosim'],
    'facilitate':           ['ajutăm'],
    'operationalize':       ['băgăm în practică'],
    'ideate':               ['ne gândim la ceva', 'ședință de idei trăsnite'],
    'deep-dive':            ['băgăm nasu mai adânc', 'scormonim un pic'],
    'drill-down':           ['hai mai la fund', 'intrăm în amănunte'],
    'low-hanging':          ['ce se ia ușor', 'ce pică singur din pom'],
    'quick-win':            ['ceva ușor de bifat'],
    'best-practices':       ['cum fac oamenii normali', 'așa se face, zice-se'],
    'outside-box':          ['gândește, bă, altfel', 'visare cu ochii deschiși'],
    'move-needle':          ['să schimbe ceva, pe bune'],
    'game-changer':         ['chestie tare de tot', 'ne schimbă viața (nu)'],
    'value-add':            ['ceva folositor', 'să iasă ceva bun'],
    'win-win':              ['ies toți bine', 'ne bucurăm toți'],
    'paradigm-shift':       ['altă mâncare de pește'],
    'holistic':             ['de la cap la coadă'],
    'granular':             ['pe firimituri', 'pe bucățele'],
    'actionable':           ['de care poți face ceva'],
    'boil-ocean':           ['să fierbem marea, bă'],
    'table-stakes':         ['minimul minimorum'],
    'north-star':           ['unde ne prefacem că mergem'],
    'the-ask':              ['ce vreau io de fapt'],
    'learnings':            ['ce-am învățat, dacă am învățat'],
    'next-level':           ['s-o facem și mai și'],
    'reinvent-wheel':       ['descoperim apa caldă'],
    'food-for-thought':     ['gândește-te și tu'],
    'brain-dump':           ['zic tot ce-mi trece prin cap'],
    'high-level':           ['pe scurt', 'așa, în mare'],
    'in-the-weeds':         ['ne-am pierdut în detalii'],
    'step-back':            ['hai s-o luăm de la capăt'],
    'end-of-day-phrase':    ['până la urmă'],
    'it-is-what-it-is':     ['asta e, ce să faci'],
    'socialize':            ['dăm sfoară-n țară'],
    'flagpole':             ['întreb șefu și-ți zic'],

    // ---- Politica de birou -------------------------------------------
    'stakeholders':         ['ăia cu interese', 'ăia importanți'],
    'leadership':           ['ăia de sus', 'șefii mari'],
    'escalate':             ['mă duc la șefu', 'fac scandal mai sus'],
    'pushback':             ['gura lumii', 'sar oamenii'],
    'ownership':            ['te ocupi tu', 'e treaba ta acum'],
    'drive-forward':        ['împinge tu căruța'],
    'bring-to-table':       ['aduce și el ceva'],
    'swim-lane':            ['cine ce face'],
    'with-respect':         ['cu tot respectul (adică zero)'],
    'correct-me':           ['greșești, dar zic frumos'],
    'missing-something':    ['tu ești ăla care greșește'],
    'to-clarify':           ['ca să fie clar'],
    'company-policy':       ['așa zice hârtia'],
    'we-value':             ['ne prefacem că ne pasă'],
    'restructuring':        ['tăiem în carne vie'],
    'layoffs':              ['dăm oameni afară'],
    'onboarding':           ['băgăm în pâine'],
    'offboarding':          ['scoatem din pâine'],
    'headcount':            ['oameni', 'oameni și bani'],

    // ---- Munca propriu-zisa ------------------------------------------
    'bandwidth':            ['chef și timp', 'nervi și timp'],
    'no-bandwidth':         ['n-am nici chef, nici timp', 'sunt praf, bă'],
    'action-items':         ['ce-avem de făcut', 'cine ce face'],
    'deliverables':         ['ce trebuie livrat'],
    'blocker':              ['chestia care ne ține-n loc'],
    'blocked':              ['stau degeaba'],
    'backlog':              ['grămada de treburi'],
    'sprint':               ['goana de două săptămâni'],
    'mvp':                  ['varianta de mântuială'],
    'poc':                  ['ceva făcut pe genunchi'],
    'tech-debt':            ['mizeria de sub covor'],
    'nice-to-have':         ['dacă rămâne timp (nu rămâne)'],
    'must-have':            ['musai', 'bătut în cuie'],
    'prioritize':           ['punem primul'],
    'deprioritize':         ['băgăm la sertar'],
    'on-my-radar':          ['știu de treaba asta'],
    'single-source':        ['unde scrie adevărul'],
    'roadmap':              ['planul de pe hârtie'],
    'eta':                  ['când e gata, bă?'],
    'ballpark':             ['așa, cu aproximație'],
    'mission-critical':     ['moare lumea fără asta'],
    'top-priority':         ['cel mai urgent (ca toate)'],
    'urgent':               ['urgent (ca de obicei)'],
    'fire-drill':           ['panică generală'],

    // ---- Absenta si program ------------------------------------------
    'ooo':                  ['sunt plecat, nu mă căuta'],
    'pto':                  ['concediu, bă'],
    'wfh':                  ['de-acasă, în papuci'],
    }
  };

  root.SlangPackRO = pack;
  if (typeof module !== 'undefined' && module.exports) module.exports = pack;
})(typeof globalThis !== 'undefined' ? globalThis : this);
