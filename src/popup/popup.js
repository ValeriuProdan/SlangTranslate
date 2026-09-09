'use strict';

const DEFAULTS = {
  enabled: true,
  language: SlangPacks.DEFAULT_ID,
  strictness: 'normal',
  highlight: true
};

/**
 * The popup speaks whichever language it is translating into. Two small
 * tables beat pulling in chrome.i18n and a _locales tree for this.
 */
const STRINGS = {
  ro: {
    enabledLabel: 'Traducerea e pornita',
    hintOn: 'mailurile sunt rescrise',
    hintOff: 'totul ramane in engleza de corporatie',
    languageLabel: 'Limba',
    languageHint: 'in ce le traducem',
    strictnessLabel: 'Toleranta la typo-uri',
    strictnessHint: 'prinde si variante scrise gresit',
    strict: 'strict',
    normal: 'normal',
    loose: 'lejer',
    highlightLabel: 'Evidentiaza traducerile',
    highlightHint: 'oricum, click pe una arata originalul',
    pauseLabel: 'Pauza',
    pauseHint: 'oprire temporara, reporneste singura',
    pause15: '15 min',
    pause60: '1 ora',
    pauseTomorrow: 'pana maine',
    resume: 'Reia acum',
    pausedPrefix: 'in pauza pana la',
    tomorrowAt: 'maine la',
    leftSuffix: 'ramase',
    countSuffix: 'traduceri pe pagina asta',
    emptyDefault: 'Deschide un mail corporatist si revino.',
    emptyNone: 'Niciun corporatism gasit. Suspect.',
    emptyUnsupported: 'Nu e o pagina de mail suportata.',
    phrases: 'expresii',
    patterns: 'tipare',
    footer: 'Totul se intampla local. Nimic nu pleaca nicaieri.'
  },
  en: {
    enabledLabel: 'Translation is on',
    hintOn: 'your mail is being rewritten',
    hintOff: 'corporate speak left untouched',
    languageLabel: 'Language',
    languageHint: 'what to rewrite into',
    strictnessLabel: 'Typo tolerance',
    strictnessHint: 'also catches misspelled variants',
    strict: 'strict',
    normal: 'normal',
    loose: 'loose',
    highlightLabel: 'Highlight the swaps',
    highlightHint: 'either way, click one to see the original',
    pauseLabel: 'Pause',
    pauseHint: 'temporary, resumes on its own',
    pause15: '15 min',
    pause60: '1 hour',
    pauseTomorrow: 'until tomorrow',
    resume: 'Resume now',
    pausedPrefix: 'paused until',
    tomorrowAt: 'tomorrow at',
    leftSuffix: 'left',
    countSuffix: 'swaps on this page',
    emptyDefault: 'Open a corporate email and come back.',
    emptyNone: 'No corporate speak found. Suspicious.',
    emptyUnsupported: 'Not a supported mail page.',
    phrases: 'phrases',
    patterns: 'patterns',
    footer: 'All local. Nothing ever leaves your browser.'
  }
};

const els = {
  enabled: document.getElementById('enabled'),
  language: document.getElementById('language'),
  strictness: document.getElementById('strictness'),
  highlight: document.getElementById('highlight'),
  count: document.getElementById('count'),
  top: document.getElementById('top'),
  empty: document.getElementById('empty'),
  hint: document.getElementById('state-hint'),
  dict: document.getElementById('dict-line'),
  pauseRow: document.getElementById('pause-row'),
  pauseHint: document.getElementById('pause-hint'),
  pauseActions: document.getElementById('pause-actions')
};

let current = Object.assign({}, DEFAULTS);
let pausedUntil = 0;

SlangPacks.list().forEach(function (pack) {
  const option = document.createElement('option');
  option.value = pack.id;
  option.textContent = pack.nativeLabel;
  els.language.append(option);
});

// Label everything up front so the popup never flashes empty rows while
// storage resolves.
paint();

chrome.storage.sync.get(DEFAULTS, function (config) {
  current = config;
  els.enabled.checked = config.enabled;
  els.language.value = config.language;
  els.strictness.value = config.strictness;
  els.highlight.checked = config.highlight;
  paint();
});

els.enabled.addEventListener('change', function () {
  current.enabled = els.enabled.checked;
  chrome.storage.sync.set({ enabled: current.enabled });
  // Switching it back on is an explicit "I want it now", so it also
  // cancels a running pause.
  if (current.enabled && SlangPause.isPaused(pausedUntil, Date.now())) {
    setPause(0);
  } else {
    paint();
  }
});

chrome.storage.local.get({ pausedUntil: 0 }, function (local) {
  pausedUntil = local.pausedUntil || 0;
  paint();
});

function setPause(until) {
  pausedUntil = until;
  chrome.storage.local.set({ pausedUntil: until });
  paint();
}

/** The pause row is either a set of durations or a countdown. */
function paintPause() {
  const text = strings();
  const now = Date.now();
  const paused = SlangPause.isPaused(pausedUntil, now);

  els.pauseRow.classList.toggle('is-paused', paused);
  els.pauseActions.textContent = '';

  if (paused) {
    const at = SlangPause.isNextDay(pausedUntil, now)
      ? text.tomorrowAt + ' ' + SlangPause.formatUntil(pausedUntil)
      : SlangPause.formatUntil(pausedUntil);
    els.pauseHint.textContent = text.pausedPrefix + ' ' + at + ' \u00b7 ' +
      SlangPause.formatRemaining(SlangPause.remaining(pausedUntil, now)) + ' ' + text.leftSuffix;
    els.pauseActions.append(button(text.resume, 'resume', function () { setPause(0); }));
    return;
  }

  els.pauseHint.textContent = text.pauseHint;
  SlangPause.DURATIONS.forEach(function (duration) {
    els.pauseActions.append(button(text[duration.labelKey], '', function () {
      setPause(SlangPause.until(duration.id, Date.now()));
    }));
  });
}

function button(label, className, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = className;
  el.textContent = label;
  el.addEventListener('click', onClick);
  return el;
}
els.language.addEventListener('change', function () {
  current.language = els.language.value;
  chrome.storage.sync.set({ language: current.language });
  paint();
});
els.strictness.addEventListener('change', function () {
  chrome.storage.sync.set({ strictness: els.strictness.value });
});
els.highlight.addEventListener('change', function () {
  chrome.storage.sync.set({ highlight: els.highlight.checked });
});

function strings() {
  return STRINGS[current.language] || STRINGS[SlangPacks.DEFAULT_ID];
}

/** Re-labels the whole popup in the currently selected language. */
function paint() {
  const text = strings();
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const value = text[el.getAttribute('data-i18n')];
    if (value) el.textContent = value;
  });
  els.hint.textContent = current.enabled ? text.hintOn : text.hintOff;

  const pack = SlangPacks.list().filter(function (p) { return p.id === current.language; })[0];
  if (pack) {
    els.dict.textContent = pack.nativeLabel.toLowerCase() + ' · ' +
      pack.coverage + ' ' + text.phrases;
  }
  if (!els.empty.dataset.locked) els.empty.textContent = text.emptyDefault;
  paintPause();
}

// The content script only lives on the supported mail hosts, so no answer
// here simply means "not a mail tab".
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const tab = tabs[0];
  if (!tab || tab.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, { type: 'slang:stats' }, function (response) {
    if (chrome.runtime.lastError || !response || !response.ok) {
      els.empty.dataset.locked = '1';
      els.empty.textContent = strings().emptyUnsupported;
      return;
    }
    render(response);
  });
});

function render(data) {
  const text = strings();
  els.count.textContent = data.count;
  if (data.dictionary) {
    els.dict.textContent = (els.dict.textContent || '') + ', ' +
      data.dictionary.patterns + ' ' + text.patterns;
  }
  if (!data.top.length) {
    els.empty.dataset.locked = '1';
    els.empty.textContent = data.count ? text.emptyDefault : text.emptyNone;
    return;
  }
  els.empty.remove();
  data.top.forEach(function (item) {
    const li = document.createElement('li');
    li.append(
      make('span', 'from', item.original),
      make('span', 'arrow', '→'),
      make('span', 'to', item.replacement)
    );
    if (item.count > 1) li.append(make('span', 'n', '×' + item.count));
    els.top.append(li);
  });
}

function make(tag, className, value) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = value;
  return el;
}
