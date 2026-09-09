'use strict';

const DEFAULTS = { enabled: true, strictness: 'normal', showOriginal: true };

const els = {
  enabled: document.getElementById('enabled'),
  strictness: document.getElementById('strictness'),
  showOriginal: document.getElementById('showOriginal'),
  count: document.getElementById('count'),
  top: document.getElementById('top'),
  empty: document.getElementById('empty'),
  hint: document.getElementById('state-hint'),
  dict: document.getElementById('dict-line')
};

chrome.storage.sync.get(DEFAULTS, function (config) {
  els.enabled.checked = config.enabled;
  els.strictness.value = config.strictness;
  els.showOriginal.checked = config.showOriginal;
  updateHint(config.enabled);
});

els.enabled.addEventListener('change', function () {
  chrome.storage.sync.set({ enabled: els.enabled.checked });
  updateHint(els.enabled.checked);
});
els.strictness.addEventListener('change', function () {
  chrome.storage.sync.set({ strictness: els.strictness.value });
});
els.showOriginal.addEventListener('change', function () {
  chrome.storage.sync.set({ showOriginal: els.showOriginal.checked });
});

function updateHint(enabled) {
  els.hint.textContent = enabled ? 'mailurile sunt rescrise' : 'totul e in engleza de corporatie';
}

// The content script only lives on the supported mail hosts, so a missing
// answer here just means "not a mail tab".
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const tab = tabs[0];
  if (!tab || tab.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, { type: 'slang:stats' }, function (response) {
    if (chrome.runtime.lastError || !response || !response.ok) {
      els.empty.textContent = 'Nu e o pagina de mail suportata.';
      return;
    }
    render(response);
  });
});

function render(data) {
  els.count.textContent = data.count;
  if (data.dictionary) {
    els.dict.textContent = 'romana · ' + data.dictionary.entries + ' expresii, ' +
      data.dictionary.patterns + ' tipare';
  }
  if (!data.top.length) {
    els.empty.textContent = data.count
      ? 'Traduceri facute, dar fara detalii.'
      : 'Niciun corporatism gasit. Suspect.';
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

function make(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}
