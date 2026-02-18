// ═══════════════════════════════════════════════════════════════
// EXPORT (CSV / JSON)
// ═══════════════════════════════════════════════════════════════

function exportCSV() {
  const hdr = 'File,Category,PCB,SW,HW\n';
  const rows = filteredResults.map(r =>
    [
      r.file,
      r.category.replace('VERSION_',''),
      r.pcb,
      r.sw ? 'sw' + formatSwVersion(r.sw) : '',
      r.hw ? 'hw' + r.hw : ''
    ]
    .map(v => `"${String(v).replace(/"/g,'""')}"`)
    .join(',')
  ).join('\n');
  download('firmware_versions.csv', hdr + rows, 'text/csv');
}

function exportJSON() {
  const data = {
    files: fileList.map(f=>f.name),
    modules: allModules,
    results: filteredResults,
    changelog: allChangelog,
  };
  download('firmware_analysis.json', JSON.stringify(data, null, 2), 'application/json');
}

function download(name, content, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = name; a.click();
}
