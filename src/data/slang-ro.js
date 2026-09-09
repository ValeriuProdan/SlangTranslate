/**
 * Romanian slang, keyed by phrase id (see phrases.js and phrases-ro.js).
 *
 * Two rules, in this order:
 *
 * 1. Keep the grammar. A replacement has to slot into the sentence where the
 *    original stood, so it must be the same kind of phrase. "OOO" is a state
 *    you can be in -- "I'll be OOO next week" -- so it becomes "tolanit la
 *    soare", not "sunt plecat", which is a whole clause and would leave the
 *    sentence in pieces.
 * 2. Then be funny. Write what somebody would say out loud, not a polite
 *    gloss: "auzi ba", never "ca sa stii si tu".
 *
 * This pack also covers Romanian corporate speak, which the English pack has
 * no reason to.
 */
(function (root) {
  'use strict';

  const pack = {
    id: 'ro',
    label: 'Romana',
    nativeLabel: 'Rom\u00e2n\u0103',
    out: {
    // ---- Clasicele -----------------------------------------------------
    'fyi':                    ['auzi ba'],
    'follow-up':              ['te sun io, dacă-mi arde', 'îți dau bip, poate'],
    'circle-back':            ['ne auzim, adică nu', 'vorbim la Paștele cailor'],
    'touch-base':             ['dăm un bip', 'ne vedem la o bere'],
    'per-my-last-email':      ['citește, bă, mailul', 'ți-am scris, deschide ochii'],
    'please-advise':          ['zi ceva, bă', 'ai amuțit?'],
    'moving-forward':         ['de-acu-ncolo', 'gata, altă viață'],
    'earliest-convenience':   ['când te-o tăia capul', 'când oi avea chef'],
    'asap':                   ['ieri, bă', 'acu, că ard toate'],
    'eod':                    ['până diseară', 'până pleacă lumea acasă'],
    'eow':                    ['până vineri', 'până vineri, teoretic'],
    'checking-in':            ['mai trăiești?', 'ai murit acolo?'],
    'gentle-reminder':        ['a treia oară, bă', 'iar eu, tot eu'],
    'nudge':                  ['un ghiont prietenesc'],
    'any-updates':            ['s-a mișcat ceva?', 'mai suflă?'],
    'bump':                   ['sus, bă', 'sus cu el, că s-a-necat'],

    // ---- Ritualuri de mail ---------------------------------------------
    'hope-well':              ['sper că mai trăiești', 'sper că n-ai murit'],
    'apologies-delay':        ['am uitat de tine', 'l-am văzut acu două săptămâni'],
    'thanks-advance':         ['mersi, că n-ai scăpare', 'mersi, că oricum o faci'],
    'thanks-patience':        ['mersi că înghiți'],
    'regards':                ['pa', 'te pup', 'salut și la revedere'],
    'looking-forward':        ['aștept până la Paștele cailor', 'aștept, fără speranțe'],
    'happy-to-help':          ['n-am ce face, te ajut', 'cu drag, chipurile'],
    'hope-helps':             ['sper că-ți folosește la ceva'],
    'find-attached':          ['ți-am pus fișieru acolo', 'uite-l, deschide-l'],
    'as-discussed':           ['cum am zis', 'cum ziceam la telefon'],
    'as-you-know':            ['știi tu bine'],
    'per-usual':              ['ca de obicei'],
    'kindly':                 ['te rog frumos'],
    'do-the-needful':         ['bagă, bă', 'fă și tu ce trebuie'],
    'lmk':                    ['zi-mi și mie', 'dă-mi bip'],
    'thoughts':               ['părerea ta'],
    'keep-posted':            ['zi-mi ce mai e', 'ține-mă la curent, că mor'],
    'in-the-loop':            ['la curent'],
    'loop-in':                ['îl bag și pe el', 'îi dau și lui bip'],
    'ping-me':                ['dă-mi bip', 'sună, scrie, ceva'],
    'reach-out':              ['dau io un semn', 'te caut io'],
    'heads-up':               ['ia aminte', 'te-am prevenit, să nu zici'],
    'flagging':               ['trag un semnal', 'atenție aici'],
    'bear-with-me':           ['stai bre un pic'],
    'no-worries':             ['lasă, frate', 'n-ai griji'],
    'sounds-good':            ['merge', 'e ok, bă'],
    'quick-question':         ['o întrebare scurtă (nu e scurtă)'],
    'tldr':                   ['pe scurt, bă'],

    // ---- Sedinte si sincronizari ---------------------------------------
    'sync':                   ['o vorbă la cafea', 'cinci minute (o oră)'],
    'lets-connect':           ['hai să dăm o vorbă', 'hai să ne auzim'],
    'one-on-one':             ['o vorbă în doi'],
    'standup':                ['raportul de dimineață'],
    'retro':                  ['ședința de plâns'],
    'all-hands':              ['adunarea'],
    'all-hands-deck':         ['toată lumea la treabă'],
    'take-offline':           ['vorbim între patru ochi', 'vorbim noi separat'],
    'park-it':                ['băgăm la sertar', 'lăsăm pe altă dată'],
    'cadence':                ['ritmul întâlnirilor'],
    'touchpoint':             ['o vorbă, un bip'],
    'align':                  ['hai să ne-nțelegem', 'batem palma'],
    'alignment':              ['înțelegere'],
    'same-page':              ['ne-am înțeles', 'vorbim aceeași limbă'],
    'level-set':              ['nu-ți face speranțe', 'să ne lămurim de la-nceput'],
    'buy-in':                 ['să zică și șefii da', 'să fie toți de acord'],

    // ---- Vorbe mari, continut zero -------------------------------------
    'synergy':                ['magie corporatistă', 'chestii care merg împreună'],
    'leverage':               ['ne folosim de', 'punem la treabă'],
    'utilize':                ['folosim'],
    'facilitate':             ['ajutăm'],
    'operationalize':         ['băgăm în practică'],
    'ideate':                 ['ne gândim la ceva'],
    'ideation':               ['ședință de idei trăsnite'],
    'deep-dive':              ['băgăm nasu mai adânc', 'scormonim un pic'],
    'drill-down':             ['hai mai la fund', 'intrăm în amănunte'],
    'low-hanging':            ['ce se ia ușor', 'ce pică singur din pom'],
    'quick-win':              ['ceva ușor de bifat'],
    'best-practices':         ['cum fac oamenii normali', 'așa se face, zice-se'],
    'outside-box':            ['gândește, bă, altfel', 'visare cu ochii deschiși'],
    'move-needle':            ['chiar schimbă ceva'],
    'game-changer':           ['chestie tare de tot', 'ne schimbă viața (nu)'],
    'value-add':              ['ceva folositor', 'să iasă ceva bun'],
    'win-win':                ['ies toți bine', 'ne bucurăm toți'],
    'paradigm-shift':         ['altă mâncare de pește'],
    'holistic':               ['de la cap la coadă'],
    'granular':               ['pe firimituri', 'pe bucățele'],
    'actionable':             ['de care poți face ceva'],
    'boil-ocean':             ['să fierbem marea, bă'],
    'table-stakes':           ['minimul minimorum'],
    'north-star':             ['ținta cea mare'],
    'the-ask':                ['ce vreau io de fapt'],
    'learnings':              ['ce-am învățat, dacă am învățat'],
    'next-level':             ['s-o facem și mai și'],
    'reinvent-wheel':         ['descoperim apa caldă'],
    'food-for-thought':       ['gândește-te și tu'],
    'brain-dump':             ['zic tot ce-mi trece prin cap'],
    'high-level':             ['pe scurt', 'așa, în mare'],
    'in-the-weeds':           ['pierduți în detalii'],
    'step-back':              ['hai s-o luăm de la capăt'],
    'end-of-day-phrase':      ['până la urmă'],
    'it-is-what-it-is':       ['asta e, ce să faci'],
    'socialize':              ['dăm sfoară-n țară'],
    'flagpole':               ['întreb șefu și-ți zic'],

    // ---- Politica de birou ---------------------------------------------
    'stakeholders':           ['ăia cu interese', 'ăia importanți'],
    'leadership':             ['ăia de sus', 'șefii mari'],
    'escalate':               ['mă duc la șefu', 'fac scandal mai sus'],
    'escalation':             ['plângere la șefi'],
    'pushback':               ['gura lumii', 'sar oamenii'],
    'ownership':              ['te ocupi tu', 'e treaba ta acum'],
    'drive-forward':          ['împinge tu căruța'],
    'bring-to-table':         ['aduce și el ceva'],
    'swim-lane':              ['cine ce face'],
    'with-respect':           ['cu tot respectul (adică zero)'],
    'correct-me':             ['greșești, dar zic frumos'],
    'missing-something':      ['tu ești ăla care greșește'],
    'to-clarify':             ['ca să fie clar'],
    'company-policy':         ['așa zice hârtia'],
    'we-value':               ['ne prefacem că ne pasă'],
    'restructuring':          ['tăiem în carne vie'],
    'layoffs':                ['dăm oameni afară'],
    'onboarding':             ['băgatul în pâine'],
    'offboarding':            ['scosul din pâine'],
    'headcount':              ['oameni', 'oameni și bani'],

    // ---- Munca propriu-zisa --------------------------------------------
    'bandwidth':              ['chef și timp', 'nervi și timp'],
    'no-bandwidth':           ['n-am nici chef, nici timp', 'sunt praf, bă'],
    'action-items':           ['ce-avem de făcut', 'cine ce face'],
    'deliverables':           ['ce trebuie livrat'],
    'blocker':                ['chestia care ne ține-n loc'],
    'blocked':                ['stau degeaba'],
    'backlog':                ['grămada de treburi'],
    'sprint':                 ['goana de două săptămâni'],
    'mvp':                    ['varianta de mântuială'],
    'poc':                    ['ceva făcut pe genunchi'],
    'tech-debt':              ['mizeria de sub covor'],
    'nice-to-have':           ['dacă rămâne timp (nu rămâne)'],
    'must-have':              ['musai', 'bătut în cuie'],
    'prioritize':             ['punem primul'],
    'deprioritize':           ['băgăm la sertar'],
    'on-my-radar':            ['în vizor'],
    'single-source':          ['unde scrie adevărul'],
    'roadmap':                ['planul de pe hârtie'],
    'eta':                    ['termenul, chipurile'],
    'ballpark':               ['o cifră din burtă'],
    'mission-critical':       ['moare lumea fără asta'],
    'top-priority':           ['cel mai urgent (ca toate)'],
    'urgent':                 ['urgent (ca de obicei)'],
    'fire-drill':             ['panică generală'],

    // ---- Absenta si program --------------------------------------------
    'ooo':                    ['tolănit la soare', 'plecat de tot'],
    'pto':                    ['concediu'],
    'wfh':                    ['de-acasă, în papuci'],
    // ---- Formule de mail -----------------------------------------------
    'ro-dispozitie':          ['sunt aici, teoretic', 'mă găsești, poate'],
    'ro-cu-stima':            ['pa', 'te pup'],
    'ro-multumesc-anticipat': ['mersi, că n-ai scăpare'],
    'ro-astept-interes':      ['aștept, fără speranțe'],
    'ro-confirmati':          ['zi și tu că ai primit'],
    'ro-informam':            ['îți zicem că'],
    'ro-scuze-intarziere':    ['am uitat de tine, scuze'],
    'ro-va-rog-frumos':       ['te rog frumos'],
    'ro-tin-la-curent':       ['îți zic ce mai e'],
    'ro-revin':               ['te caut io, poate', 'îți zic io ceva'],

    // ---- Referinte si trimiteri ----------------------------------------
    'ro-conform':             ['cum am vorbit', 'cum ziceam'],
    'ro-ramane-stabilit':     ['ne-am înțeles'],
    'ro-cu-referire':         ['despre', 'legat de'],
    'ro-mentionez':           ['zic doar că'],
    'ro-punct-de-vedere':     ['după mine'],
    'ro-in-atentia':          ['pentru'],

    // ---- Timp si urgenta -----------------------------------------------
    'ro-scurt-timp':          ['cât de repede poți', 'pe repede înainte'],
    'ro-cu-celeritate':       ['repede, bă'],
    'ro-moment-oportun':      ['când o fi'],
    'ro-termen-limita':       ['termenul, adică ieri'],
    'ro-finalul-zilei':       ['până la urmă'],

    // ---- Verbe de sedinta ----------------------------------------------
    'ro-demara':              ['începem'],
    'ro-solicita':            ['cerem'],
    'ro-efectua':             ['facem'],
    'ro-identifica':          ['găsim'],
    'ro-implementa':          ['băgăm'],
    'ro-valida':              ['zicem da'],
    'ro-agrea':               ['ne-am înțeles'],
    'ro-alinia':              ['ne punem de acord'],
    'ro-prioritiza':          ['punem primul'],
    'ro-optimiza':            ['facem mai bine'],
    'ro-eficientiza':         ['facem mai repede'],
    'ro-capitaliza':          ['profităm de'],
    'ro-targeta':             ['țintim'],
    'ro-demersuri':           ['mișcăm ceva'],
    'ro-bun-sfarsit':         ['terminăm'],
    'ro-avea-in-vedere':      ['ține minte că', 'ai grijă că'],
    'ro-lua-in-considerare':  ['ne gândim la'],

    // ---- Substantive de corporatie -------------------------------------
    'ro-livrabile':           ['ce trebuie predat'],
    'ro-sedinta-lucru':       ['o vorbă lungă'],
    'ro-provocare':           ['belea', 'bătaie de cap'],
    'ro-oportunitate':        ['șansă', 'ocazie'],
    'ro-problematica':        ['beleaua'],
    'ro-aspecte':             ['chestii'],
    'ro-sinergie':            ['magie corporatistă'],
    'ro-resurse':             ['oameni și bani'],
    'ro-necesita':            ['are nevoie de'],
    'ro-la-nivel-de':         ['pe partea de'],
    'ro-pe-zona-de':          ['pe partea de'],
    'ro-in-masura':           ['dacă'],
    }
  };

  root.SlangPackRO = pack;
  if (typeof module !== 'undefined' && module.exports) module.exports = pack;
})(typeof globalThis !== 'undefined' ? globalThis : this);
