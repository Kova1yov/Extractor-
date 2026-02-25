// ═══════════════════════════════════════════════════════════════
// UI CONTROLS (tabs, clear, progress)
// ═══════════════════════════════════════════════════════════════

// Cached progress DOM elements
const _pfEl   = () => document.getElementById('pf');
const _ppctEl = () => document.getElementById('ppct');
const _plblEl = () => document.getElementById('plbl');
let _pf, _ppct, _plbl;

function setProgress(done, total, label) {
  if (!_pf) { _pf = _pfEl(); _ppct = _ppctEl(); _plbl = _plblEl(); }
  const pct = total ? Math.round(done / total * 100) : 0;
  _pf.style.width       = pct + '%';
  _ppct.textContent     = pct + '%';
  _plbl.textContent     = `Processing: ${label} (${done}/${total})`;
}

function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

function renderAll() {
  renderSummary();
  renderVersionsTab();
  renderModulesTab();
  renderStringsTab();
  renderChangelogTab();
  buildFileFilter();
}

function showUI() {
  document.getElementById('summary').style.display = 'block';
  document.getElementById('tabs').style.display    = 'flex';
  document.getElementById('ctrl').style.display    = 'flex';
}

function clearAll(silent) {
  allResults = []; allStrings = []; allModules = {}; allChangelog = []; fileList = [];
  addResult._seen = new Set();
  uniqueMode = false;
  _pf = _ppct = _plbl = null; // reset cache on clear
  if (!silent) {
    document.getElementById('summary').style.display = 'none';
    document.getElementById('tabs').style.display    = 'none';
    document.getElementById('ctrl').style.display    = 'none';
    document.getElementById('pw').style.display      = 'none';
    document.getElementById('fin').value = '';
    ['tab-versions','tab-modules','tab-strings','tab-changelog'].forEach(id => {
      document.getElementById(id).innerHTML = '';
    });
    const sel = document.getElementById('file-filter');
    if (sel) sel.innerHTML = '<option value="">All files</option>';
  }
}
