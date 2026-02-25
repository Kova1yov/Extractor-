// ═══════════════════════════════════════════════════════════════
// DIRECTORY HANDLING
// ═══════════════════════════════════════════════════════════════

let savedDirectoryPath = '';

async function handleDirectorySelection(files) {
  if (!files || !files.length) return;

  const firstFile = files[0];
  const fullPath = firstFile.webkitRelativePath || firstFile.name;
  const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || fullPath;

  savedDirectoryPath = dirPath;
  localStorage.setItem('savedDirectoryPath', dirPath);

  updateDirectoryDisplay(dirPath, files.length);
  startBatch(files);
}

function updateDirectoryDisplay(path, fileCount) {
  const savedDirEl = document.getElementById('saved-dir');
  const pathDisplay = document.getElementById('dir-path-display');
  const infoDisplay = document.getElementById('dir-info');

  savedDirEl.classList.add('active');
  pathDisplay.textContent = path;
  infoDisplay.innerHTML = `📂 Directory saved. Found <b>${fileCount}</b> files. Click <b>Refresh</b> to reload files from this directory.`;
}

function refreshDirectory() {
  if (!savedDirectoryPath) {
    alert('No directory saved. Please select a directory first.');
    return;
  }
  document.getElementById('dir-input').click();
}

function clearSavedDirectory() {
  savedDirectoryPath = '';
  localStorage.removeItem('savedDirectoryPath');

  const savedDirEl = document.getElementById('saved-dir');
  savedDirEl.classList.remove('active');

  clearAll();
}
