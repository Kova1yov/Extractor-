// ═══════════════════════════════════════════════════════════════
// LIBRARY SWITCHER (ROBE / ROXX / Clay Paky)
// ═══════════════════════════════════════════════════════════════

const LIBRARIES = {
  robin:    { name: 'ROBE',      emoji: '📦' },
  roxx:     { name: 'ROXX',      emoji: '🔵' },
  claypaky: { name: 'Clay Paky', emoji: '🟡' },
};
const LIB_ORDER = ['robin', 'roxx', 'claypaky'];

let currentLib = 'robin';

const LIB_CONFIG = {
  robin:    { accept: '.lib,.a,.bin', title: 'Drop up to 250 .lib / .a / .bin files here', icon: '📦' },
  roxx:     { accept: '.ckf',         title: 'Drop up to 250 .ckf files here',              icon: '🔵' },
  claypaky: { accept: '.lib,.a,.bin', title: 'Drop up to 250 .lib / .a / .bin files here', icon: '🟡' },
};

function cycleLibrary() {
  const idx = LIB_ORDER.indexOf(currentLib);
  switchLibrary(LIB_ORDER[(idx + 1) % LIB_ORDER.length]);
}

function updateDropZone(lib) {
  const cfg = LIB_CONFIG[lib];
  document.getElementById('fin').accept = cfg.accept;
  document.getElementById('drop-icon').textContent = cfg.icon;
  document.getElementById('drop-title').textContent = cfg.title;
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

function switchLibrary(lib) {
  currentLib = lib;

  document.body.className = document.body.className.replace(/\bmode-\w+/g, '').trim();
  document.body.classList.add('mode-' + lib);

  setTitleText(LIBRARIES[lib].name);
  document.title = LIBRARIES[lib].name;
  updateDropZone(lib);

  localStorage.setItem('activeLibrary', lib);
  clearAll();

  const savedAnimation = localStorage.getItem('titleAnimation') || 'gradient-flow';
  changeAnimation(savedAnimation);
}
