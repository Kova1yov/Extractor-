// ═══════════════════════════════════════════════════════════════
// BATCH FILE PROCESSOR
// ═══════════════════════════════════════════════════════════════

function processFile(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buf = new Uint8Array(e.target.result);
        parseLib(buf, file.name);
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

  const validFiles = Array.from(files).filter(f =>
    f.name.toLowerCase().endsWith('.lib') ||
    f.name.toLowerCase().endsWith('.a')   ||
    f.name.toLowerCase().endsWith('.bin')
  );

  if (!validFiles.length) {
    alert('No valid .lib, .a, or .bin files found.');
    return;
  }

  fileList = validFiles.slice(0, 250);
  document.getElementById('pw').style.display = 'block';

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    setProgress(i, fileList.length, file.name);
    await processFile(file);
  }

  setProgress(fileList.length, fileList.length, 'Complete');
  setTimeout(() => { document.getElementById('pw').style.display = 'none'; }, 600);

  renderAll();
  showUI();
}
