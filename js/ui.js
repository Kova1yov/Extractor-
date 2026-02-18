// ═══════════════════════════════════════════════════════════════
// UI CONTROLS (tabs, clear, progress)
// ═══════════════════════════════════════════════════════════════

function setProgress(done, total, label) {
  const pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('pf').style.width = pct + '%';
  document.getElementById('ppct').textContent = pct + '%';
  document.getElementById('plbl').textContent = `Processing: ${label} (${done}/${total})`;
}

function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

function clearAll(silent) {
  allResults = []; allStrings = []; allModules = {}; allChangelog = []; fileList = [];
  addResult._seen = new Set();
  uniqueMode = false;
  if (!silent) {
    document.getElementById('summary').style.display = 'none';
    document.getElementById('tabs').style.display   = 'none';
    document.getElementById('ctrl').style.display   = 'none';
    document.getElementById('pw').style.display     = 'none';
    document.getElementById('fin').value = '';
    ['tab-versions','tab-modules','tab-strings','tab-changelog'].forEach(id => {
      document.getElementById(id).innerHTML = '';
    });
    const sel = document.getElementById('file-filter');
    if (sel) sel.innerHTML = '<option value="">All files</option>';
  }
}
