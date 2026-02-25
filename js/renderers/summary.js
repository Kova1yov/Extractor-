// ═══════════════════════════════════════════════════════════════
// RENDER — SUMMARY STATS
// ═══════════════════════════════════════════════════════════════

function renderSummary() {
  const swVer = new Set(allResults.filter(r=>r.sw).map(r=>r.sw)).size;
  const hwVer = new Set(allResults.filter(r=>r.hw).map(r=>r.hw)).size;
  const pcbCount = new Set(allResults.filter(r=>r.pcb).map(r=>r.pcb)).size;
  const clTot = allChangelog.reduce((s,c)=>s+c.lines.length, 0);

  document.getElementById('stat-row').innerHTML = `
    <div class="stat-box c1 fade-in"><div class="stat-n">${fileList.length}</div><div class="stat-l">Files processed</div></div>
    <div class="stat-box c2 fade-in"><div class="stat-n">${pcbCount}</div><div class="stat-l">PCBs</div></div>
    <div class="stat-box c3 fade-in"><div class="stat-n">${swVer}</div><div class="stat-l">SW versions</div></div>
    <div class="stat-box c5 fade-in"><div class="stat-n">${clTot}</div><div class="stat-l">Changelog lines</div></div>
  `;

  document.getElementById('tab-versions').innerHTML = `
    <div class="count-line" id="count-v"></div>
    <div class="tbl-wrap">
      <div class="tbl-scroll">
        <table class="main-tbl">
          <thead><tr>
            <th onclick="setSort('file', event)">File<span class="sort-ico">↕</span></th>
            <th onclick="setSort('category', event)">Type<span class="sort-ico">↕</span></th>
            <th onclick="setSort('pcb', event)">PCB<span class="sort-ico">↕</span></th>
            <th onclick="setSort('ver', event)">Version<span class="sort-ico">↕</span></th>
            <th></th>
          </tr></thead>
          <tbody class="tbody-scroll" id="vtbody"></tbody>
        </table>
      </div>
    </div>`;
  applyFilters();
}
