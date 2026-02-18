// ═══════════════════════════════════════════════════════════════
// PATTERNS
// ═══════════════════════════════════════════════════════════════

// forte_* module + version: forte_m v23 / forte_l1v27 / forte_l1_v27
const RE_FORTE = /\bforte_([a-z0-9]+)\b[_\s]*v?(\d+)/gi;

// PCB name + sw/hw versions like in the screenshot: sw33/hw10, sw12/hw10
const RE_PCB_VER = /\b(PCB\s*[A-Z][A-Z0-9]*)\s*[:\-=]?\s*((?:sw\d+\/hw\d+(?:,sw\d+\/hw\d+)*))/gi;
const RE_SWVER = /\bsw\s*(\d+[\d.]*)/gi;
const RE_HWVER = /\bhw\s*(\d+[\d.]*)/gi;

// Generic version numbers
const RE_VER_DOT = /\bv?\d{1,3}\.\d{1,3}(?:\.\d{1,5})?(?:\.\d+)?\b/g;

// Driver/device identifiers like RB3409v21
const RE_DRIVER = /\b([A-Z]{1,4}\d{3,6})[_\s]?v(\d+)\b/gi;

// rforte_dv variants
const RE_RFORTE = /\brforte_([a-z0-9_]+)\b/gi;

// Changelog lines (start with - or * and mention versions)
const RE_CL = /^[\-\*•]\s*.{5,}/;

// Min string length
const MIN_LEN = 4;

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let allResults   = []; // { file, offset, raw, category, pcb, module, sw, hw, ver, note }
let allStrings   = []; // { file, offset, str, category }
let allModules   = {}; // { 'forte_m': { file, versions:[] } }
let allChangelog = []; // { file, lines:[] }
let fileList     = [];
let filteredResults = []; // Currently displayed (filtered) results
let uniqueMode   = false;
let sortCol      = 'file';
let sortDir      = 1;

// ═══════════════════════════════════════════════════════════════
// DROP / FILE INPUT
// ═══════════════════════════════════════════════════════════════
const drop = document.getElementById('drop');
drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); startBatch(e.dataTransfer.files); });
document.getElementById('fin').addEventListener('change', e => startBatch(e.target.files));
document.getElementById('dir-input').addEventListener('change', e => handleDirectorySelection(e.target.files));

// ═══════════════════════════════════════════════════════════════
// DIRECTORY HANDLING
// ═══════════════════════════════════════════════════════════════
let savedDirectoryHandle = null;
let savedDirectoryPath = '';

async function handleDirectorySelection(files) {
  if (!files || !files.length) return;

  // Отримуємо шлях директорії з першого файлу
  const firstFile = files[0];
  const fullPath = firstFile.webkitRelativePath || firstFile.name;
  const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || fullPath;

  // Зберігаємо файли та шлях
  savedDirectoryPath = dirPath;
  localStorage.setItem('savedDirectoryPath', dirPath);

  // Показуємо збережену директорію
  updateDirectoryDisplay(dirPath, files.length);

  // Запускаємо обробку файлів
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

async function refreshDirectory() {
  if (!savedDirectoryPath) {
    alert('No directory saved. Please select a directory first.');
    return;
  }

  // Програмно клікаємо на input для вибору директорії
  document.getElementById('dir-input').click();
}

function clearSavedDirectory() {
  savedDirectoryPath = '';
  savedDirectoryHandle = null;
  localStorage.removeItem('savedDirectoryPath');

  const savedDirEl = document.getElementById('saved-dir');
  savedDirEl.classList.remove('active');

  clearAll();
}

// Завантаження збереженої директорії при старті
window.addEventListener('DOMContentLoaded', () => {
  const savedPath = localStorage.getItem('savedDirectoryPath');
  if (savedPath) {
    const savedDirEl = document.getElementById('saved-dir');
    const pathDisplay = document.getElementById('dir-path-display');
    const infoDisplay = document.getElementById('dir-info');

    savedDirEl.classList.add('active');
    pathDisplay.textContent = savedPath;
    infoDisplay.innerHTML = `📂 Previous directory: <b>${savedPath}</b><br>Click <b>Refresh</b> to reload files from this directory.`;
  }
});

// ═══════════════════════════════════════════════════════════════
// BATCH PROCESSOR
// ═══════════════════════════════════════════════════════════════
async function startBatch(files) {
  clearAll(true);
  if (!files || !files.length) return;

  // Фільтруємо файли відповідно до поточного режиму бібліотеки
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

// ═══════════════════════════════════════════════════════════════
// PARSER
// ═══════════════════════════════════════════════════════════════
function parseLib(buf, filename) {
  // Extract all ASCII strings
  const strings = extractStrings(buf);

  // Changelog bucket - будемо збирати блоками
  const clLines = [];
  let currentVersionHeader = null;

  for (const { offset, str } of strings) {
    // Always store in all-strings
    const cat = categorize(str);
    allStrings.push({ file: filename, offset, str, category: cat });

    const trimmed = str.trim();

    // Перевіряємо чи це заголовок версії:
    // - V2, V3, v10, V14 (V або v + 1-3 цифри)
    // - 13072544, 14011651 (8 цифр - формат дати)
    const isShortVersion = /^[Vv]\d{1,3}$/.test(trimmed);
    const isDateVersion = /^\d{8}$/.test(trimmed);
    const isVersionHeader = isShortVersion || isDateVersion;

    // Перевіряємо чи це справжній changelog запис:
    // 1. Починається з -, *, • (можливо з пробілами)
    // 2. Містить принаймні 10 символів
    // 3. Містить принаймні 5 літер (не просто символи)
    // 4. Містить пробіл (означає що є слова, а не просто набір символів)
    const startsWithMarker = /^[\s\t]*[\-\*•]/.test(trimmed);
    const hasEnoughLength = trimmed.length >= 10;
    const hasEnoughLetters = (trimmed.match(/[a-zA-Z]/g) || []).length >= 5;
    const hasSpaces = /\s/.test(trimmed);
    const notTooManySpecialChars = (trimmed.match(/[^a-zA-Z0-9\s\-\*•(),./]/g) || []).length < trimmed.length * 0.3;

    const isChangelogLine = startsWithMarker &&
                            hasEnoughLength &&
                            hasEnoughLetters &&
                            hasSpaces &&
                            notTooManySpecialChars &&
                            !hasSequentialRun(trimmed);

    if (isVersionHeader) {
      // Зберігаємо як заголовок версії
      currentVersionHeader = trimmed;
      clLines.push(''); // Пуста лінія для відступу
      clLines.push(`=== ${trimmed} ===`);
    } else if (isChangelogLine) {
      // Це справжній changelog запис
      clLines.push(trimmed);
    }

    // ── forte_* modules ──
    let m;
    const re1 = new RegExp(RE_FORTE.source, 'gi');
    while ((m = re1.exec(str)) !== null) {
      const mod = 'forte_' + m[1].toLowerCase();
      const ver = parseInt(m[2], 10);
      const key = mod;
      if (!allModules[key]) allModules[key] = { module: mod, versions: [], files: [] };
      if (!allModules[key].versions.includes(ver)) allModules[key].versions.push(ver);
      if (!allModules[key].files.includes(filename)) allModules[key].files.push(filename);
      addResult({ file: filename, offset, raw: str, category: 'MODULE', module: mod, ver: 'v' + ver, sw: '', hw: '', pcb: '' });
    }

    // ── PCB sw/hw ──
    const re2 = new RegExp(RE_PCB_VER.source, 'gi');
    while ((m = re2.exec(str)) !== null) {
      const pcb = m[1].replace(/\s+/g,' ').trim();
      const verStr = m[2];
      const pairs = verStr.split(',');
      for (const pair of pairs) {
        const swm = pair.match(/sw(\d+[\d.]*)/i);
        const hwm = pair.match(/hw(\d+[\d.]*)/i);
        addResult({
          file: filename, offset, raw: str, category: 'VERSION_SW',
          pcb, sw: swm ? swm[1] : '', hw: hwm ? hwm[1] : '', module: '', ver: pair.trim()
        });
      }
    }

    // ── Standalone sw / hw ──
    const re3 = new RegExp(RE_SWVER.source, 'gi');
    while ((m = re3.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'VERSION_SW', sw: m[1], hw: '', pcb: '', module: '', ver: 'sw' + m[1] });
    }
    const re4 = new RegExp(RE_HWVER.source, 'gi');
    while ((m = re4.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'VERSION_HW', sw: '', hw: m[1], pcb: '', module: '', ver: 'hw' + m[1] });
    }

    // ── Generic dotted versions ──
    const re5 = new RegExp(RE_VER_DOT.source, 'g');
    while ((m = re5.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'GENERAL', ver: m[0], sw: '', hw: '', pcb: '', module: '' });
    }

    // ── Driver/device ──
    const re6 = new RegExp(RE_DRIVER.source, 'gi');
    while ((m = re6.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'DRIVER', ver: m[1] + 'v' + m[2], sw: '', hw: '', pcb: '', module: m[1] });
    }

    // ── rforte_ ──
    const re7 = new RegExp(RE_RFORTE.source, 'gi');
    while ((m = re7.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'MODULE', ver: m[0], module: m[0], sw: '', hw: '', pcb: '' });
    }
  }

  if (clLines.length > 0) {
    allChangelog.push({ file: filename, lines: clLines });
  }
}

// ═══════════════════════════════════════════════════════════════
// CKF PARSER (ROXX — XOR 0x21 encoded)
// ═══════════════════════════════════════════════════════════════
function parseCkf(buf, filename) {
  // CKF files are XOR-encoded with key 0x21
  const decoded = new Uint8Array(buf.length);
  for (let i = 0; i < buf.length; i++) decoded[i] = buf[i] ^ 0x21;

  // Extract null-terminated strings from decoded buffer
  const strings = extractStringsFromBuffer(decoded);

  // State for cluster/board context
  let clusterName = '';
  const clLines = [];

  // Try to get cluster name from filename: B2-FC-V1_4.CKF → B2-FC
  const fnMatch = filename.match(/^([A-Z0-9\-]+?)[-_]V[\d_]+\.ckf$/i);
  if (fnMatch) clusterName = fnMatch[1];

  // Also look for 'CLUSTER ...' and 'SW.Vx.x' in decoded strings
  let swVer = '', hwVer = '', bootVer = '';
  const versionStrings = [];

  for (const { offset, str } of strings) {
    const trimmed = str.trim();

    // Store all strings
    const cat = categorizeCkf(trimmed);
    allStrings.push({ file: filename, offset, str: trimmed, category: cat });

    // Cluster name: "CLUSTER B2 FC"
    const clusterM = trimmed.match(/^CLUSTER\s+(.+)$/i);
    if (clusterM) clusterName = clusterM[1].trim();

    // SW version: "SW.V1.4" or "V1.4"
    const swM = trimmed.match(/^SW[.\s]*V?(\d+\.\d+[\d.]*)$/i);
    if (swM) { swVer = swM[1]; versionStrings.push({ type: 'SW', ver: swM[1] }); }

    // Standalone version like "V1.4", "V1.1" etc.
    const verM = trimmed.match(/^V(\d+\.\d+[\d.]*)$/i);
    if (verM && !swM) versionStrings.push({ type: 'VER', ver: verM[1] });

    // BOOT versions
    if (/^BOOT$/i.test(trimmed)) {
      // Next few strings after BOOT are likely boot partition versions
    }
    const bootM = trimmed.match(/^BOOT\s+V?(\d+\.\d+)/i);
    if (bootM) { bootVer = bootM[1]; versionStrings.push({ type: 'BOOT', ver: bootM[1] }); }

    // Generic dotted versions
    const genM = trimmed.match(/\bV?(\d+\.\d+[\d.]*)\b/i);
    if (genM && trimmed.length < 20) versionStrings.push({ type: 'GENERAL', ver: genM[1] });

    // Module-like strings (channel configs, features)
    if (/strobe|dimmer|colour|color|fan|fixture|channel|macro|calibrat/i.test(trimmed) && trimmed.length > 3 && trimmed.length < 60) {
      addResult({ file: filename, offset, raw: trimmed, category: 'MODULE', module: trimmed, ver: '', sw: swVer, hw: hwVer, pcb: clusterName });
    }

    // Changelog-like lines — строга фільтрація від бінарних/lookup даних
    if (isHumanReadable(trimmed)) {
      clLines.push(trimmed);
    }
  }

  // Add version results
  const pcb = clusterName || filename.replace(/\.ckf$/i, '');
  const seenVers = new Set();
  for (const v of versionStrings) {
    if (seenVers.has(v.type + v.ver)) continue;
    seenVers.add(v.type + v.ver);
    if (v.type === 'SW') {
      addResult({ file: filename, offset: 0, raw: `SW.V${v.ver}`, category: 'VERSION_SW', pcb, sw: v.ver, hw: hwVer, module: '', ver: `sw${v.ver}` });
    } else if (v.type === 'BOOT') {
      addResult({ file: filename, offset: 0, raw: `BOOT V${v.ver}`, category: 'GENERAL', pcb, sw: '', hw: '', module: 'BOOT', ver: `V${v.ver}` });
    } else if (v.type === 'VER') {
      addResult({ file: filename, offset: 0, raw: `V${v.ver}`, category: 'GENERAL', pcb, sw: '', hw: '', module: '', ver: `V${v.ver}` });
    }
  }

  // If we found cluster but no SW ver from decoded strings, try filename
  if (!swVer) {
    const fvM = filename.match(/V([\d_]+)\.ckf$/i);
    if (fvM) {
      const fv = fvM[1].replace(/_/g, '.');
      addResult({ file: filename, offset: 0, raw: `V${fv} (from filename)`, category: 'VERSION_SW', pcb, sw: fv, hw: '', module: '', ver: `sw${fv}` });
    }
  }

  if (clLines.length > 0) allChangelog.push({ file: filename, lines: clLines });
}

function extractStringsFromBuffer(buf) {
  const out = [];
  let start = -1, cur = '';
  for (let i = 0; i <= buf.length; i++) {
    const b = i < buf.length ? buf[i] : 0;
    const ok = b >= 0x20 && b <= 0x7E;
    if (ok) { if (start < 0) start = i; cur += String.fromCharCode(b); }
    else {
      if (cur.length >= 3) out.push({ offset: start, str: cur.trim() });
      start = -1; cur = '';
    }
  }
  return out;
}

function categorizeCkf(str) {
  if (/^SW[.\s]*V?\d/i.test(str)) return 'VERSION_SW';
  if (/^BOOT/i.test(str)) return 'GENERAL';
  if (/^V\d+\.\d+/i.test(str)) return 'GENERAL';
  if (/CLUSTER/i.test(str)) return 'MODULE';
  if (/strobe|dimmer|colour|color|fan|fixture/i.test(str)) return 'MODULE';
  return 'STRING';
}

// Перевіряє чи є рядок читабельним текстом (не бінарний/lookup-таблиця)
function hasSequentialRun(str, minRun = 6) {
  let run = 1;
  for (let i = 1; i < str.length; i++) {
    const d = str.charCodeAt(i) - str.charCodeAt(i - 1);
    if (d === 1 || d === -1) { if (++run >= minRun) return true; }
    else run = 1;
  }
  return false;
}

function isHumanReadable(str) {
  if (str.length < 5 || str.length > 120) return false;

  // Мінімум 60% літер серед всіх символів
  const letters = (str.match(/[a-zA-Z]/g) || []).length;
  if (letters / str.length < 0.4) return false;

  // Обов'язково є пробіл або це одне значуще слово >= 4 літер
  const hasSpace = /\s/.test(str);
  const words = str.trim().split(/\s+/);
  if (!hasSpace && words[0].length < 4) return false;

  // Відхиляємо послідовні ASCII-символи (lookup tables / gamma curves)
  // Ознака: >= 6 символів підряд з різницею 1 або -1 (ascending/descending runs)
  let runLen = 1;
  for (let i = 1; i < str.length; i++) {
    const diff = str.charCodeAt(i) - str.charCodeAt(i - 1);
    if (diff === 1 || diff === -1) {
      runLen++;
      if (runLen >= 6) return false; // довга послідовна серія — бінарні дані
    } else {
      runLen = 1;
    }
  }

  // Відхиляємо рядки де більше 30% символів не-алфавітні і не пробіл (крім . , - : /)
  const noise = (str.match(/[^a-zA-Z0-9\s.,\-:/()'!?]/g) || []).length;
  if (noise / str.length > 0.25) return false;

  // Мінімум одне слово >= 3 літери поспіль
  if (!/[a-zA-Z]{3}/.test(str)) return false;

  return true;
}

function addResult(r) {
  // Deduplicate by file+raw+ver combo
  const key = r.file + '|' + r.raw + '|' + r.ver;
  if (!addResult._seen) addResult._seen = new Set();
  if (addResult._seen.has(key)) return;
  addResult._seen.add(key);
  allResults.push(r);
}

function categorize(str) {
  if (/forte_/i.test(str)) return 'MODULE';
  if (/copyright/i.test(str)) return 'COPYRIGHT';
  if (/\bsw\d|\bhw\d|PCB\s*[A-Z]/i.test(str)) return 'VERSION_SW';
  if (/v\d+\.\d+/i.test(str)) return 'GENERAL';
  if (/build|compiler|gcc|clang/i.test(str)) return 'BUILD';
  if (/\d{4}-\d{2}-\d{2}/.test(str)) return 'DATE';
  return 'STRING';
}

// ═══════════════════════════════════════════════════════════════
// STRING EXTRACTOR
// ═══════════════════════════════════════════════════════════════
function extractStrings(buf) {
  const out = [];
  let start = -1, cur = '';
  for (let i = 0; i <= buf.length; i++) {
    const b = i < buf.length ? buf[i] : 0;
    const ok = (b >= 0x20 && b <= 0x7E) || b === 0x09;
    if (ok) { if (start < 0) start = i; cur += String.fromCharCode(b); }
    else {
      if (cur.length >= MIN_LEN) out.push({ offset: start, str: cur });
      start = -1; cur = '';
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════
// RENDER – VERSIONS TAB
// ═══════════════════════════════════════════════════════════════
function renderVersionsTab() {
  applyFilters();
}

function applyFilters() {
  const q    = (document.getElementById('q')?.value || '').toLowerCase().trim();
  const fFile = document.getElementById('file-filter')?.value || '';
  const fCat  = document.getElementById('cat-filter')?.value || '';

  const tbody = document.getElementById('vtbody');
  if (!tbody) return;

  // Якщо файл не обрано, показуємо порожню таблицю з підказкою
  if (!fFile && fileList.length > 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty" style="padding: 60px 20px;">Please select a file from the dropdown above to view results</td></tr>';
    document.getElementById('count-v') && (document.getElementById('count-v').innerHTML =
      `<span style="color: var(--muted);">Select a file to display entries</span>`);
    filteredResults = [];

    // Показуємо стрілку-підказку
    const hint = document.getElementById('file-select-hint');
    if (hint) hint.style.display = 'block';

    return;
  }

  // Ховаємо стрілку якщо файл обрано
  const hint = document.getElementById('file-select-hint');
  if (hint && fFile) hint.style.display = 'none';

  let rows = allResults;
  // Фільтруємо щоб показувати тільки рядки з PCB (виключаємо пусті та "—")
  rows = rows.filter(r => r.pcb && r.pcb !== '—' && r.pcb.trim() !== '');
  if (fFile) rows = rows.filter(r => r.file === fFile);
  if (fCat)  rows = rows.filter(r => r.category === fCat);
  if (q)     rows = rows.filter(r =>
    r.file.toLowerCase().includes(q) ||
    r.raw.toLowerCase().includes(q) ||
    r.ver.toLowerCase().includes(q) ||
    r.module.toLowerCase().includes(q) ||
    r.pcb.toLowerCase().includes(q)
  );

  if (uniqueMode) {
    const seen = new Set();
    rows = rows.filter(r => {
      const k = r.category + '|' + r.ver + '|' + r.module + '|' + r.pcb;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  }

  // Sort
  rows = [...rows].sort((a,b) => {
    const av = a[sortCol] || '', bv = b[sortCol] || '';
    return av < bv ? -sortDir : av > bv ? sortDir : 0;
  });

  // Зберігаємо відфільтровані результати для експорту
  filteredResults = rows;

  document.getElementById('count-v') && (document.getElementById('count-v').innerHTML =
    `Showing <b>${rows.length.toLocaleString()}</b> entries`);

  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty">No results match the current filter.</td></tr>'; return; }

  tbody.innerHTML = rows.slice(0, 3000).map(r => `
    <tr>
      <td class="td-file"><span title="${escH(r.file)}">${escH(shortName(r.file))}</span></td>
      <td><span class="ver-badge ${catBadge(r.category)}">${escH(r.category.replace('VERSION_',''))}</span></td>
      <td class="td-pcb">${escH(r.pcb || '—')}</td>
      <td>
        ${r.sw ? `<span class="ver-badge ver-sw">sw${escH(formatSwVersion(r.sw))}</span>` : ''}
        ${r.hw ? `<span class="ver-badge ver-hw">hw${escH(r.hw)}</span>` : ''}
        ${(!r.sw && !r.hw) ? `<span class="ver-badge ${catBadge(r.category)}">${escH(r.ver)}</span>` : ''}
      </td>
    </tr>
  `).join('');
}

function catBadge(cat) {
  return { VERSION_SW:'ver-sw', VERSION_HW:'ver-hw', MODULE:'ver-mod', DRIVER:'ver-drv', GENERAL:'ver-generic' }[cat] || 'ver-generic';
}

// ═══════════════════════════════════════════════════════════════
// RENDER – MODULES TAB
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

// ═══════════════════════════════════════════════════════════════
// RENDER – STRINGS TAB
// ═══════════════════════════════════════════════════════════════
function renderStringsTab() {
  const el = document.getElementById('tab-strings');
  const rows = allStrings.filter(s => s.category !== 'STRING').slice(0, 4000);

  if (!rows.length) { el.innerHTML = '<div class="empty">No relevant strings found.</div>'; return; }

  const rowsHtml = rows.map(s => {
    const preview = s.str.length > 100 ? s.str.slice(0, 100) + '…' : s.str;
    return `<div class="str-row">
      <div style="font-size:11px;color:var(--blue);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escH(s.file)}">${escH(shortName(s.file))}</div>
      <div style="font-size:11px;color:var(--muted)">0x${s.offset.toString(16).toUpperCase().padStart(6,'0')}</div>
      <div style="font-size:12px;word-break:break-all">${escH(preview)}</div>
      <div><span class="ver-badge ${catBadge(s.category)}" style="font-size:9px">${escH(s.category)}</span></div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="str-tbl fade-in">
      <div class="str-tbl-head"><span>File</span><span>Offset</span><span>String</span><span>Category</span></div>
      <div class="str-body">${rowsHtml}</div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// RENDER – CHANGELOG TAB
// ═══════════════════════════════════════════════════════════════
function renderChangelogTab() {
  const el = document.getElementById('tab-changelog');
  if (!allChangelog.length) { el.innerHTML = '<div class="empty">No changelog entries detected.</div>'; return; }

  const cards = allChangelog.map(c => {
    const lines = c.lines.map(l => {
      const hl = l.replace(/\b(v\d+[\d.]*|sw\s*\d+|hw\s*\d+|\bRB\d+v\d+)/gi, '<span class="cl-highlight">$1</span>');
      return `<div class="cl-line">${escH2(hl)}</div>`;
    }).join('');
    return `<div class="cl-entry fade-in"><div class="cl-file">📄 ${escH(c.file)}</div>${lines}</div>`;
  }).join('');

  el.innerHTML = cards;
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY
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

  // Also build versions table structure
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

// ═══════════════════════════════════════════════════════════════
// PROGRESS UI
// ═══════════════════════════════════════════════════════════════
function setProgress(done, total, label) {
  const pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('pf').style.width = pct + '%';
  document.getElementById('ppct').textContent = pct + '%';
  document.getElementById('plbl').textContent = `Processing: ${label} (${done}/${total})`;
}

// ═══════════════════════════════════════════════════════════════
// SORT
// ═══════════════════════════════════════════════════════════════
function setSort(col) {
  if (sortCol === col) sortDir *= -1;
  else { sortCol = col; sortDir = 1; }
  document.querySelectorAll('.main-tbl th').forEach(th => th.classList.remove('sorted'));
  event.target.closest('th').classList.add('sorted');
  applyFilters();
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
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

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function buildFileFilter() {
  const sel = document.getElementById('file-filter');
  if (!sel) return;
  fileList.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.name; opt.textContent = shortName(f.name);
    sel.appendChild(opt);
  });
}

function onFileFilterChange() {
  applyFilters();
  showFileChangelog();
}

function showFileChangelog() {
  const selectedFile = document.getElementById('file-filter')?.value;
  const panel = document.getElementById('file-changelog-panel');
  const content = document.getElementById('file-changelog-content');
  const filename = document.getElementById('changelog-filename');

  if (!selectedFile) {
    panel.style.display = 'none';
    return;
  }

  // Знаходимо changelog для обраного файлу
  const fileChangelog = allChangelog.find(c => c.file === selectedFile);

  if (!fileChangelog || !fileChangelog.lines.length) {
    content.innerHTML = '<div class="file-cl-empty">No changelog entries found for this file.</div>';
    filename.textContent = selectedFile;
    panel.style.display = 'block';
    return;
  }

  // Функція для очищення від нечитабельних символів
  function cleanText(text) {
    return text
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .trim();
  }

  // Форматуємо changelog записи
  const lines = fileChangelog.lines
    .map(line => cleanText(line))
    .filter(line => line.length > 0) // Залишаємо всі непусті лінії
    .map(line => {
      // Перевіряємо чи це заголовок версії
      if (/^===\s*(.+)\s*===$/.test(line)) {
        const version = line.match(/^===\s*(.+)\s*===$/)[1];
        return `<div style="font-family: var(--ui); font-size: 16px; font-weight: 700; color: var(--green); margin: 20px 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid var(--border);">${escH(version)}</div>`;
      }

      // Пропускаємо пусті лінії (для відступів між версіями)
      if (line === '') {
        return '<div style="height: 10px;"></div>';
      }

      // Видаляємо невалідні рядки (тільки спецсимволи, короткі без змісту)
      if (!/[a-zA-Z0-9]/.test(line) || line.length < 3) {
        return '';
      }

      // Escape HTML спочатку
      const escaped = escH(line);

      // Підсвічуємо версії та важливі слова
      const highlighted = escaped
        .replace(/\b(v\d+[\d.]*|sw\s*\d+|hw\s*\d+|\bRB\d+v\d+)/gi, '<span class="file-cl-highlight">$1</span>')
        .replace(/\b(added|fixed|changed|updated|removed|improved|fix|change|add|update|remove|improve|correction|optimization)/gi, '<span class="file-cl-highlight">$1</span>');

      return `<div class="file-cl-line">${highlighted}</div>`;
    })
    .filter(line => line !== ''); // Видаляємо пусті рядки

  if (lines.length === 0) {
    content.innerHTML = '<div class="file-cl-empty">No readable changelog entries found for this file.</div>';
  } else {
    content.innerHTML = lines.join('');
  }

  filename.textContent = selectedFile;
  panel.style.display = 'block';

  // Scroll до панелі
  setTimeout(() => {
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function closeFileChangelog() {
  document.getElementById('file-changelog-panel').style.display = 'none';
}

function toggleUnique() {
  uniqueMode = !uniqueMode;
  document.getElementById('btn-unique').classList.toggle('active', uniqueMode);
  applyFilters();
}

function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

function clearAll(silent) {
  allResults = []; allStrings = []; allModules = {}; allChangelog = []; fileList = [];
  addResult._seen = new Set();
  uniqueMode = false;
  if (!silent) {
    document.getElementById('summary').style.display = 'none';
    document.getElementById('tabs').style.display   = 'none';
    document.getElementById('ctrl').style.display   = 'none';
    document.getElementById('pw').style.display     = 'none';
    document.getElementById('fin').value = '';
    ['tab-versions','tab-modules','tab-strings','tab-changelog'].forEach(id => {
      document.getElementById(id).innerHTML = '';
    });
    const sel = document.getElementById('file-filter');
    if (sel) sel.innerHTML = '<option value="">All files</option>';
  }
}

function shortName(n) { return n.length > 28 ? '…' + n.slice(-26) : n; }
function fmtSize(n) { return n < 1024 ? n+'B' : n < 1048576 ? (n/1024).toFixed(0)+'KB' : (n/1048576).toFixed(1)+'MB'; }
function escH(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// escH2 allows pre-escaped HTML spans through
function escH2(s) { return s.replace(/&(?!amp;|lt;|gt;|quot;|#)/g,'&amp;'); }
// Format SW version: 10 -> 1.0, 32 -> 3.2, etc.
function formatSwVersion(sw) {
  const num = parseInt(sw, 10);
  if (isNaN(num) || num < 10) return sw;
  const str = num.toString();
  return str.slice(0, -1) + '.' + str.slice(-1);
}

// ═══════════════════════════════════════════════════════════════
// TITLE ANIMATIONS
// ═══════════════════════════════════════════════════════════════
function changeAnimation(type) {
  const title = document.getElementById('animated-title');

  // Видаляємо всі класи анімацій
  title.className = '';

  // Додаємо новий клас
  switch(type) {
    case 'gradient-flow':
      title.className = 'title-gradient-flow';
      // Додаємо рандомні значення для хаотичної анімації
      const letters = title.querySelectorAll('.letter');
      letters.forEach((letter, i) => {
        letter.style.setProperty('--i', i);
        letter.style.setProperty('--random', Math.random());
        letter.style.setProperty('--scale-1', 0.95 + Math.random() * 0.3); // 0.95-1.25
        letter.style.setProperty('--scale-2', 0.85 + Math.random() * 0.2); // 0.85-1.05
        letter.style.setProperty('--scale-3', 1.0 + Math.random() * 0.25); // 1.0-1.25
      });
      break;
    case 'wave':
      title.className = 'title-wave';
      // Додаємо CSS змінну для кожної літери
      const waveLetters = title.querySelectorAll('.letter');
      waveLetters.forEach((letter, i) => {
        letter.style.setProperty('--i', i);
      });
      break;
    case 'pulse':
      title.className = 'title-pulse';
      break;
    case 'typing':
      title.className = 'title-typing';
      break;
    case 'glitch':
      title.className = 'title-glitch';
      title.setAttribute('data-text', title.textContent.trim());
      break;
    case 'none':
      title.className = 'title-none';
      break;
  }

  // Зберігаємо вибір
  localStorage.setItem('titleAnimation', type);
}

// ═══════════════════════════════════════════════════════════════
// LIBRARY SWITCHER
// ═══════════════════════════════════════════════════════════════
const LIBRARIES = {
  robin:    { name: 'ROBE',      emoji: '📦' },
  roxx:     { name: 'ROXX',      emoji: '🔵' },
  claypaky: { name: 'Clay Paky', emoji: '🟡' },
};
const LIB_ORDER = ['robin', 'roxx', 'claypaky'];

let currentLib = 'robin';

function cycleLibrary() {
  const idx = LIB_ORDER.indexOf(currentLib);
  const nextLib = LIB_ORDER[(idx + 1) % LIB_ORDER.length];
  switchLibrary(nextLib);
}

const LIB_CONFIG = {
  robin:    { accept: '.lib,.a,.bin', title: 'Drop up to 250 .lib / .a / .bin files here', icon: '📦' },
  roxx:     { accept: '.ckf',         title: 'Drop up to 250 .ckf files here',              icon: '🔵' },
  claypaky: { accept: '.lib,.a,.bin', title: 'Drop up to 250 .lib / .a / .bin files here', icon: '🟡' },
};

function updateDropZone(lib) {
  const cfg = LIB_CONFIG[lib];
  document.getElementById('fin').accept = cfg.accept;
  document.getElementById('drop-icon').textContent = cfg.icon;
  document.getElementById('drop-title').textContent = cfg.title;
}

function switchLibrary(lib) {
  currentLib = lib;

  // Update body class for accent color
  document.body.className = document.body.className.replace(/\bmode-\w+/g, '').trim();
  document.body.classList.add('mode-' + lib);

  // Update title text
  setTitleText(LIBRARIES[lib].name);

  // Update browser tab title
  document.title = LIBRARIES[lib].name;

  // Update drop zone
  updateDropZone(lib);

  // Зберігаємо вибір
  localStorage.setItem('activeLibrary', lib);

  // Clear data when switching library
  clearAll();

  // Re-apply current animation with new letters
  const savedAnimation = localStorage.getItem('titleAnimation') || 'gradient-flow';
  changeAnimation(savedAnimation);
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
  // Restore class
  title.className = currentClass;
}

window.addEventListener('DOMContentLoaded', () => {
  // Відновлюємо збережену бібліотеку
  const savedLib = localStorage.getItem('activeLibrary') || 'robin';
  currentLib = savedLib;
  document.body.classList.add('mode-' + savedLib);
  document.title = LIBRARIES[savedLib].name;
  setTitleText(LIBRARIES[savedLib].name);
  updateDropZone(savedLib);

  // Завантажуємо збережену анімацію
  const savedAnimation = localStorage.getItem('titleAnimation') || 'gradient-flow';
  const select = document.getElementById('animation-select');
  if (select) {
    select.value = savedAnimation;
    changeAnimation(savedAnimation);
  }

  // Показати/сховати селектор анімацій по Ctrl+Shift+A
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      const selector = document.getElementById('animation-selector');
      selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
    }
  });
});
