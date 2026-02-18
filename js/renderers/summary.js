// ═══════════════════════════════════════════════════════════════
// RENDER — SUMMARY STATS
// ═══════════════════════════════════════════════════════════════

function renderSummary() {
  const mods  = Object.keys(allModules).length;
  const swVer = new Set(allResults.filter(r=>r.sw).map(r=>r.sw)).size;
  const hwVer = new Set(allResults.filter(r=>r.hw).map(r=>r.hw)).size;
  const clTot = allChangelog.reduce((s,c)=>s+c.lines.length, 0);

  document.getElementById('stat-row').innerHTML = `
    <div class="stat-box c1 fade-in"><div class="stat-n">${fileList.length}</div><div class="stat-l">Files processed</div></div>
    <div class="stat-box c2 fade-in"><div class="stat-n">${mods}</div><div class="stat-l">forte_* modules</div></div>
    <div class="stat-box c3 fade-in"><div class="stat-n">${swVer}</div><div class="stat-l">SW versions</div></div>
    <div class="stat-box c4 fade-in"><div class="stat-n">${hwVer}</div><div class="stat-l">HW versions</div></div>
    <div class="stat-box c5 fade-in"><div class="stat-n">${clTot}</div><div class="stat-l">Changelog lines</div></div>
  `;

  document.getElementById('tab-versions').innerHTML = `
    <div class="count-line" id="count-v"></div>
    <div class="tbl-wrap">
      <div class="tbl-scroll">
        <table class="main-tbl">
          <thead><tr>
            <th onclick="setSort('file')">File<span class="sort-ico">↕</span></th>
            <th onclick="setSort('category')">Type<span class="sort-ico">↕</span></th>
            <th onclick="setSort('pcb')">PCB<span class="sort-ico">↕</span></th>
            <th onclick="setSort('ver')">Version<span class="sort-ico">↕</span></th>
          </tr></thead>
          <tbody class="tbody-scroll" id="vtbody"></tbody>
        </table>
      </div>
    </div>`;
  applyFilters();
}
