/**
 * Romanian corporate speak: the phrases Romanian offices invented themselves,
 * rather than the English ones they borrowed.
 *
 * These live apart from phrases.js because their source language matters.
 * English corporate speak turns up in everybody's email regardless of what
 * language they write in -- that is what romgleza is -- so it says nothing
 * about the writer. "Ramanem la dispozitia dumneavoastra" says a great deal:
 * nobody writes that in an English thread. The detector uses that (see
 * dom-rewrite.js), and a pack that has no words for these simply skips them.
 *
 * Patterns are matched after diacritics are stripped, so "dispozitie" and
 * "dispozitie" are the same thing to the matcher; written with them here
 * purely so they are readable.
 */
(function (root) {
  'use strict';

  const phrases = {
    version: 1,
    src: 'ro',
    entries: [
      // ---- Formule de mail -------------------------------------------
      { id: 'ro-dispozitie',
        p: ['(rămân|rămânem|răman|ramanem) la dispoziția ?(dumneavoastră|ta|voastră)', 'la dispoziția (dumneavoastră|ta|voastră)'] },
      { id: 'ro-cu-stima', p: ['cu stimă', 'cu deosebită considerație', 'cu respect'] },
      { id: 'ro-multumesc-anticipat', p: ['?vă (mulțumesc|mulțumim) anticipat'] },
      { id: 'ro-astept-interes', p: ['aștept cu interes', 'aștept un răspuns'] },
      { id: 'ro-confirmati', p: ['?vă rog ?să confirmați primirea', 'confirmați primirea'] },
      { id: 'ro-scuze-intarziere',
        p: ['?ne cerem scuze pentru întârziere', 'scuze pentru întârziere'] },
      { id: 'ro-va-rog-frumos', p: ['vă rog frumos'] },
      { id: 'ro-tin-la-curent', p: ['(vă|te|vă) (țin|ținem) la curent'] },
      { id: 'ro-revin',
        p: ['revin cu ?un (feedback|răspuns|update)', 'revin cu detalii', 'revenim cu ?un răspuns'] },

      // ---- Referinte si trimiteri ------------------------------------
      { id: 'ro-conform',
        p: ['conform discuției anterioare', 'conform celor discutate', 'conform discuției noastre', 'în urma discuției'] },
      { id: 'ro-ramane-stabilit', p: ['rămâne stabilit', 'rămâne cum am stabilit'] },
      { id: 'ro-cu-referire', p: ['cu referire la', 'referitor la', 'în ceea ce privește'] },
      { id: 'ro-mentionez',
        p: ['menționez faptul că', '?aș dori să menționez', 'țin să menționez'] },
      { id: 'ro-punct-de-vedere', p: ['din punctul meu de vedere', 'din punct de vedere'] },

      // ---- Timp si urgenta -------------------------------------------
      { id: 'ro-scurt-timp',
        p: ['în cel mai scurt timp', 'cât mai curând posibil', 'în regim de urgență'] },
      { id: 'ro-termen-limita', p: ['?termenul limită'] },
      { id: 'ro-finalul-zilei', p: ['la finalul zilei'] },

      // ---- Verbe de sedinta ------------------------------------------
      { id: 'ro-solicita', p: ['solicităm'] },
      { id: 'ro-implementa', p: ['implementăm'] },
      { id: 'ro-valida', p: ['validăm'] },
      { id: 'ro-agrea', p: ['am agreat'] },
      { id: 'ro-alinia', p: ['ne aliniem'] },
      { id: 'ro-prioritiza', p: ['prioritizăm'] },
      { id: 'ro-optimiza', p: ['optimizăm'] },
      { id: 'ro-targeta', p: ['targetăm'] },
      { id: 'ro-avea-in-vedere',
        p: ['?vă rog să aveți în vedere', 'având în vedere', 'a avea în vedere'] },
      { id: 'ro-lua-in-considerare', p: ['?(a|luăm) lua în considerare', 'luăm în considerare'] },

      // ---- Substantive de corporatie ---------------------------------
      { id: 'ro-livrabile', p: ['(livrabile|livrabil|livrabilele)'] },
      { id: 'ro-sedinta-lucru', p: ['ședință de lucru', 'ședință de sincronizare'] },
      { id: 'ro-provocare', p: ['(provocare|provocări|provocarea)'] },
      { id: 'ro-oportunitate', p: ['(oportunitate|oportunități|oportunitatea)'] },
      { id: 'ro-aspecte', p: ['(aspecte|aspectele)'] },
      { id: 'ro-sinergie', p: ['(sinergie|sinergii|sinergia)'] },
      { id: 'ro-resurse', p: ['resurse umane'] },
      { id: 'ro-la-nivel-de', p: ['la nivel de', 'la nivelul'] },
      { id: 'ro-pe-zona-de', p: ['pe zona de', 'pe partea de'] },
      { id: 'ro-face-sens', p: ['(face|faci|facem) sens'] },
      { id: 'ro-taskuri', p: ['task uri'] },
      { id: 'ro-taskurile', p: ['task (urile|urilor)'] },
      { id: 'ro-deadline', p: ['deadline (ul|ului)'] },
      { id: 'ro-call', p: ['un call'] },
      { id: 'ro-callul', p: ['call (ul|ului)'] },
      { id: 'ro-meeting', p: ['un (meeting|miting)'] },
      { id: 'ro-meetingul', p: ['(meeting|miting) (ul|ului)'] },
      { id: 'ro-target', p: ['target (ul|ului)'] },
      { id: 'ro-pipeline', p: ['pipeline (ul|ului)'] },
      { id: 'ro-feedback', p: ['un feedback'] },
      { id: 'ro-time-consuming', p: ['time consuming'] },
      { id: 'ro-per-total', p: ['per (total|ansamblu)'] },
      { id: 'ro-guru', p: ['e un guru'] },
      { id: 'ro-customiza', p: ['customizăm'] },
      { id: 'ro-sharui', p: ['(sharuim|shareuim|share-uim)'] },
      { id: 'ro-focusa', p: ['ne focusăm ?pe'] },
      { id: 'ro-adresa', p: ['adresăm'] },
      { id: 'ro-forcasta', p: ['(forcastăm|forecastăm)'] },
      { id: 'ro-updata', p: ['updatăm', 'facem update'] },
      { id: 'ro-aplica', p: ['aplic pentru'] },
      { id: 'ro-escalada', p: ['escaladăm'] },
      { id: 'ro-livra', p: ['livrăm'] },
      { id: 'ro-monitoriza', p: ['monitorizăm'] },

      // ---- Romgleza de birou -----------------------------------------
    ]
  };

  root.SlangPhrasesRO = phrases;
  if (typeof module !== 'undefined' && module.exports) module.exports = phrases;
})(typeof globalThis !== 'undefined' ? globalThis : this);
