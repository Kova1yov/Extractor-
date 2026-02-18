// ═══════════════════════════════════════════════════════════════
// INITIALIZATION — runs after DOM is ready
// ═══════════════════════════════════════════════════════════════

// Drop zone events
const drop = document.getElementById('drop');
drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); startBatch(e.dataTransfer.files); });
document.getElementById('fin').addEventListener('change', e => startBatch(e.target.files));
document.getElementById('dir-input').addEventListener('change', e => handleDirectorySelection(e.target.files));

window.addEventListener('DOMContentLoaded', () => {
  // Restore saved library
  const savedLib = localStorage.getItem('activeLibrary') || 'robin';
  currentLib = savedLib;
  document.body.classList.add('mode-' + savedLib);
  document.title = LIBRARIES[savedLib].name;
  setTitleText(LIBRARIES[savedLib].name);
  updateDropZone(savedLib);

  // Restore saved animation
  const savedAnimation = localStorage.getItem('titleAnimation') || 'gradient-flow';
  const select = document.getElementById('animation-select');
  if (select) {
    select.value = savedAnimation;
    changeAnimation(savedAnimation);
  }

  // Restore saved directory path display
  const savedPath = localStorage.getItem('savedDirectoryPath');
  if (savedPath) {
    const savedDirEl = document.getElementById('saved-dir');
    const pathDisplay = document.getElementById('dir-path-display');
    const infoDisplay = document.getElementById('dir-info');

    savedDirEl.classList.add('active');
    pathDisplay.textContent = savedPath;
    infoDisplay.innerHTML = `📂 Previous directory: <b>${savedPath}</b><br>Click <b>Refresh</b> to reload files from this directory.`;
  }

  // Toggle animation selector with Ctrl+Shift+A
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      const selector = document.getElementById('animation-selector');
      selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
    }
  });
});
