// ═══════════════════════════════════════════════════════════════
// BATCH FILE PROCESSOR
// ═══════════════════════════════════════════════════════════════

function processFile(file, idx) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buf = new Uint8Array(e.target.result);
        if (currentLib === 'roxx' || file.name.toLowerCase().endsWith('.ckf')) {
          parseCkf(buf, file.name);
        } else {
          parseLib(buf, file.name);
        }
      } catch(err) {
        console.error(file.name, err);
      }
      resolve();
    };
    reader.onerror = () => resolve();
    reader.readAsArrayBuffer(file);
  });
}

async function startBatch(files) {
  clearAll(true);
  if (!files || !files.length) return;

  let validFiles;
  if (currentLib === 'roxx') {
    validFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.ckf'));
    if (!validFiles.length) {
      alert('No valid .ckf files found. In ROXX mode only .ckf files are supported.');
      return;
    }
  } else {
    validFiles = Array.from(files).filter(f =>
      f.name.toLowerCase().endsWith('.lib') ||
      f.name.toLowerCase().endsWith('.a')   ||
      f.name.toLowerCase().endsWith('.bin')
    );
    if (!validFiles.length) {
      alert('No valid .lib, .a, or .bin files found in the selected directory.');
      return;
    }
  }

  fileList = validFiles.slice(0, 250);
  document.getElementById('pw').style.display = 'block';

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    setProgress(i, fileList.length, file.name);
    await processFile(file, i);
  }

  setProgress(fileList.length, fileList.length, 'Complete');
  setTimeout(() => { document.getElementById('pw').style.display = 'none'; }, 600);

  renderSummary();
  renderVersionsTab();
  renderModulesTab();
  renderStringsTab();
  renderChangelogTab();
  buildFileFilter();

  document.getElementById('summary').style.display = 'block';
  document.getElementById('tabs').style.display   = 'flex';
  document.getElementById('ctrl').style.display   = 'flex';
}
