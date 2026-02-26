// ═══════════════════════════════════════════════════════════════
// RENDER — COMPARE TAB (diff між двома файлами)
// ═══════════════════════════════════════════════════════════════

function _cmpGetLatest(filename) {
  const map = new Map();
  allResults
    .filter(r => r.file === filename && r.pcb && r.pcb !== '—' && r.pcb.trim() !== '')
    .forEach(r => {
      const key = r.pcb + '|' + r.category;
      const existing = map.get(key);
      if (!existing) { map.set(key, r); return; }
      const cv = parseFloat(r.sw || r.hw || r.ver || '0');
      const ev = parseFloat(existing.sw || existing.hw || existing.ver || '0');
      if (cv > ev) map.set(key, r);
    });
  return map;
}

function _cmpVerStr(r) {
  if (!r) return '—';
  return r.sw ? 'sw' + formatSwVersion(r.sw) : r.hw ? 'hw' + r.hw : r.ver || '—';
}

function _cmpVerNum(r) {
  if (!r) return null;
  return parseFloat(r.sw || r.hw || r.ver || '0');
}

function renderCompareTab() {
  const el = document.getElementById('tab-compare');
  if (!el) return;

  const files = [...new Set(allResults.map(r => r.file))];

  if (!files.length) {
    el.innerHTML = '<div class="empty">Load files first to compare versions.</div>';
    return;
  }
  if (files.length < 2) {
    el.innerHTML = '<div class="empty">Load at least 2 files to use the comparison feature.</div>';
    return;
  }

  const selA = document.getElementById('cmp-file-a')?.value || files[0];
  const selB = document.getElementById('cmp-file-b')?.value || files[files.length - 1];

  const optsA = files.map(f => `<option value="${escH(f)}"${f===selA?' selected':''}>${escH(shortName(f))}</option>`).join('');
  const optsB = files.map(f => `<option value="${escH(f)}"${f===selB?' selected':''}>${escH(shortName(f))}</option>`).join('');

  const mapA = _cmpGetLatest(selA);
  const mapB = _cmpGetLatest(selB);
  const allKeys = [...new Set([...mapA.keys(), ...mapB.keys()])].sort();

  let same=0, upgraded=0, downgraded=0, added=0, removed=0;

  const rows = allKeys.map(key => {
    const a = mapA.get(key);
    const b = mapB.get(key);
    const pcb = (a || b).pcb;
    const cat = (a || b).category.replace('VERSION_', '');
    const vA  = _cmpVerStr(a);
    const vB  = _cmpVerStr(b);
    const nA  = _cmpVerNum(a);
    const nB  = _cmpVerNum(b);

    let status, cls;
    if      (!a)       { status = '+ New';      cls = 'cmp-added';      added++; }
    else if (!b)       { status = '− Removed';  cls = 'cmp-removed';    removed++; }
    else if (nA===nB)  { status = '= Same';     cls = 'cmp-same';       same++; }
    else if (nB > nA)  { status = '↑ Updated';  cls = 'cmp-upgraded';   upgraded++; }
    else               { status = '↓ Reverted'; cls = 'cmp-downgraded'; downgraded++; }

    const cellA = a ? `<span class="ver-badge ver-sw">${escH(vA)}</span>` : `<span class="cmp-dash">—</span>`;
    const cellB = b ? `<span class="ver-badge ver-sw">${escH(vB)}</span>` : `<span class="cmp-dash">—</span>`;

    return `<tr class="${cls}">
      <td class="td-pcb">${escH(pcb)}</td>
      <td><span class="ver-badge ver-generic">${escH(cat)}</span></td>
      <td class="cmp-ver">${cellA}</td>
      <td class="cmp-ver">${cellB}</td>
      <td><span class="cmp-badge ${cls}">${status}</span></td>
    </tr>`;
  }).join('');

  const pills = [
    upgraded   ? `<span class="cmp-pill cmp-upgraded">${upgraded} updated</span>`   : '',
    downgraded ? `<span class="cmp-pill cmp-downgraded">${downgraded} reverted</span>` : '',
    added      ? `<span class="cmp-pill cmp-added">${added} new</span>`             : '',
    removed    ? `<span class="cmp-pill cmp-removed">${removed} removed</span>`     : '',
    same       ? `<span class="cmp-pill cmp-same">${same} unchanged</span>`         : '',
  ].filter(Boolean).join('');

  el.innerHTML = `
    <div class="cmp-controls">
      <div class="cmp-file-wrap">
        <label class="cmp-label">File A (base)</label>
        <select class="sel" id="cmp-file-a" onchange="renderCompareTab()">${optsA}</select>
      </div>
      <div class="cmp-arrow">→</div>
      <div class="cmp-file-wrap">
        <label class="cmp-label">File B (compare)</label>
        <select class="sel" id="cmp-file-b" onchange="renderCompareTab()">${optsB}</select>
      </div>
    </div>
    <div class="cmp-summary">${pills}</div>
    <div class="tbl-wrap">
      <div class="tbl-scroll">
        <table class="main-tbl">
          <thead><tr>
            <th>PCB</th>
            <th>Type</th>
            <th>Version A</th>
            <th>Version B</th>
            <th>Status</th>
          </tr></thead>
          <tbody class="tbody-scroll">${rows || '<tr><td colspan="5" class="empty">No data to compare.</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}
