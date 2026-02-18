// ═══════════════════════════════════════════════════════════════
// RENDER — ALL STRINGS TAB
// ═══════════════════════════════════════════════════════════════

function renderStringsTab() {
  const el = document.getElementById('tab-strings');
  const rows = allStrings.filter(s => s.category !== 'STRING').slice(0, 4000);

  if (!rows.length) { el.innerHTML = '<div class="empty">No relevant strings found.</div>'; return; }

  const rowsHtml = rows.map(s => {
    const preview = s.str.length > 100 ? s.str.slice(0, 100) + '…' : s.str;
    return `<div class="str-row">
      <div style="font-size:11px;color:var(--blue);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escH(s.file)}">${escH(shortName(s.file))}</div>
      <div style="font-size:11px;color:var(--muted)">0x${s.offset.toString(16).toUpperCase().padStart(6,'0')}</div>
      <div style="font-size:12px;word-break:break-all">${escH(preview)}</div>
      <div><span class="ver-badge ${catBadge(s.category)}" style="font-size:9px">${escH(s.category)}</span></div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="str-tbl fade-in">
      <div class="str-tbl-head"><span>File</span><span>Offset</span><span>String</span><span>Category</span></div>
      <div class="str-body">${rowsHtml}</div>
    </div>`;
}
