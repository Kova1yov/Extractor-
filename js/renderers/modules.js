// ═══════════════════════════════════════════════════════════════
// RENDER — MODULES TAB
// ═══════════════════════════════════════════════════════════════

function renderModulesTab() {
  const el = document.getElementById('tab-modules');
  const entries = Object.values(allModules);
  if (!entries.length) { el.innerHTML = '<div class="empty">No forte_* modules detected.</div>'; return; }

  entries.sort((a,b) => a.module.localeCompare(b.module));

  const cards = entries.map(e => {
    const vers = e.versions.sort((a,b)=>a-b).map(v => `<span class="ver-badge ver-mod">v${v}</span>`).join(' ');
    const files = e.files.map(f => `<span style="font-size:11px;color:var(--blue)">${escH(shortName(f))}</span>`).join(', ');
    return `
      <div class="mod-card">
        <div class="mod-card-title">${escH(e.module)}</div>
        <div class="mod-card-file">${files}</div>
        <div>${vers}</div>
      </div>`;
  }).join('');

  el.innerHTML = `<div class="mod-grid fade-in">${cards}</div>`;
}
