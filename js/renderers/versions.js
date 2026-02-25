// ═══════════════════════════════════════════════════════════════
// RENDER — VERSIONS TAB + FILTERS + SORT
// ═══════════════════════════════════════════════════════════════

function renderVersionsTab() {
  applyFilters();
}

function applyFilters() {
  const q    = (document.getElementById('q')?.value || '').toLowerCase().trim();
  const fFile = document.getElementById('file-filter')?.value || '';
  const fCat  = document.getElementById('cat-filter')?.value || '';

  const tbody = document.getElementById('vtbody');
  if (!tbody) return;

  if (!fFile && fileList.length > 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty" style="padding: 60px 20px;">Please select a file from the dropdown above to view results</td></tr>';
    document.getElementById('count-v') && (document.getElementById('count-v').innerHTML =
      `<span style="color: var(--muted);">Select a file to display entries</span>`);
    filteredResults = [];
    return;
  }

  let rows = allResults;
  rows = rows.filter(r => r.pcb && r.pcb !== '—' && r.pcb.trim() !== '');
  if (fFile) rows = rows.filter(r => r.file === fFile);
  if (fCat)  rows = rows.filter(r => r.category === fCat);
  if (q)     rows = rows.filter(r =>
    r.file.toLowerCase().includes(q) ||
    r.raw.toLowerCase().includes(q) ||
    r.ver.toLowerCase().includes(q) ||
    r.module.toLowerCase().includes(q) ||
    r.pcb.toLowerCase().includes(q)
  );

  if (uniqueMode) {
    const seen = new Set();
    rows = rows.filter(r => {
      const k = r.category + '|' + r.ver + '|' + r.module + '|' + r.pcb;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  }

  // Per (pcb, category) keep only the entry with the highest version
  const latestMap = new Map();
  rows.forEach(r => {
    const key = r.pcb + '|' + r.category;
    const existing = latestMap.get(key);
    if (!existing) {
      latestMap.set(key, r);
    } else {
      const currVer  = parseFloat(r.sw        || r.hw        || r.ver || '0');
      const existVer = parseFloat(existing.sw || existing.hw || existing.ver || '0');
      if (currVer > existVer) latestMap.set(key, r);
    }
  });
  rows = [...latestMap.values()];

  rows = [...rows].sort((a,b) => {
    const av = a[sortCol] || '', bv = b[sortCol] || '';
    return av < bv ? -sortDir : av > bv ? sortDir : 0;
  });

  filteredResults = rows;

  document.getElementById('count-v') && (document.getElementById('count-v').innerHTML =
    `Showing <b>${rows.length.toLocaleString()}</b> entries`);

  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty">No results match the current filter.</td></tr>'; return; }

  tbody.innerHTML = rows.slice(0, 3000).map(r => {
    const badge = catBadge(r.category);
    const verCell = r.sw ? `<span class="ver-badge ver-sw">sw${escH(formatSwVersion(r.sw))}</span>`
                  : r.hw ? `<span class="ver-badge ver-hw">hw${escH(r.hw)}</span>`
                  : `<span class="ver-badge ${badge}">${escH(r.ver)}</span>`;
    return `<tr>
      <td class="td-file"><span title="${escH(r.file)}">${escH(shortName(r.file))}</span></td>
      <td><span class="ver-badge ${badge}">${escH(r.category.replace('VERSION_',''))}</span></td>
      <td class="td-pcb">${escH(r.pcb || '—')}</td>
      <td>${verCell}</td>
    </tr>`;
  }).join('');
}

function setSort(col) {
  if (sortCol === col) sortDir *= -1;
  else { sortCol = col; sortDir = 1; }
  document.querySelectorAll('.main-tbl th').forEach(th => th.classList.remove('sorted'));
  event.target.closest('th').classList.add('sorted');
  applyFilters();
}

function toggleUnique() {
  uniqueMode = !uniqueMode;
  document.getElementById('btn-unique').classList.toggle('active', uniqueMode);
  applyFilters();
}

function buildFileFilter() {
  const sel = document.getElementById('file-filter');
  if (!sel) return;
  fileList.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.name; opt.textContent = shortName(f.name);
    sel.appendChild(opt);
  });
  if (fileList.length === 1) {
    sel.value = fileList[0].name;
    onFileFilterChange();
  }
}

function onFileFilterChange() {
  applyFilters();
  showFileChangelog();
}
