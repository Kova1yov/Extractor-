// ═══════════════════════════════════════════════════════════════
// LIBRARY — ROBE only
// ═══════════════════════════════════════════════════════════════

const LIBRARIES = {
  robin: { name: 'ROBE', emoji: '📦' },
};

let currentLib = 'robin';

function updateDropZone() {
  document.getElementById('fin').accept = '.lib,.a,.bin';
  document.getElementById('drop-icon').textContent = '📦';
  document.getElementById('drop-title').textContent = 'Drop up to 250 .lib / .a / .bin files here';
}

function setTitleText(text) {
  const title = document.getElementById('animated-title');
  const currentClass = title.className;
  title.innerHTML = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const span = document.createElement('span');
    if (ch === ' ') {
      span.className = 'letter space';
      span.innerHTML = ' ';
    } else {
      span.className = 'letter';
      span.textContent = ch;
    }
    title.appendChild(span);
  }
  title.className = currentClass;
}
