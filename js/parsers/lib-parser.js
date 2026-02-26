// ═══════════════════════════════════════════════════════════════
// LIB / A / BIN PARSER
// ═══════════════════════════════════════════════════════════════

function categorize(str) {
  if (/forte_/i.test(str)) return 'MODULE';
  if (/copyright/i.test(str)) return 'COPYRIGHT';
  if (/\bsw\d|\bhw\d|PCB\s*[A-Z]/i.test(str)) return 'VERSION_SW';
  if (/v\d+\.\d+/i.test(str)) return 'GENERAL';
  if (/build|compiler|gcc|clang/i.test(str)) return 'BUILD';
  if (/\d{4}-\d{2}-\d{2}/.test(str)) return 'DATE';
  return 'STRING';
}

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

// Compiled once — reused for every string in every file
const _re1 = new RegExp(RE_FORTE.source,   'gi');
const _re2 = new RegExp(RE_PCB_VER.source, 'gi');
const _re3 = new RegExp(RE_SWVER.source,   'gi');
const _re4 = new RegExp(RE_HWVER.source,   'gi');
const _re5 = new RegExp(RE_VER_DOT.source, 'g');
const _re6 = new RegExp(RE_DRIVER.source,  'gi');
const _re7 = new RegExp(RE_RFORTE.source,  'gi');

const _reShortVer    = /^[Vv]\d{1,3}$/;
const _reDateVer     = /^\d{8}$/;
const _reMarker      = /^[\s\t]*[\-\*•]/;
const _reLetters     = /[a-zA-Z]/g;
const _reSpecial     = /[^a-zA-Z0-9\s\-\*•(),./]/g;
const _reSpaces      = /\s/;
const _reWord        = /[a-zA-Z]{3,}/;

function parseLib(buf, filename) {
  const strings = extractStrings(buf);
  const clLines = [];
  let m;

  for (const { offset, str } of strings) {
    const cat = categorize(str);
    allStrings.push({ file: filename, offset, str, category: cat });

    const trimmed = str.trim();

    const isVersionHeader = _reShortVer.test(trimmed) || _reDateVer.test(trimmed);

    const isChangelogLine = _reMarker.test(trimmed) &&
                            trimmed.length >= 10 &&
                            (trimmed.match(_reLetters) || []).length >= 5 &&
                            _reSpaces.test(trimmed) &&
                            (trimmed.match(_reSpecial) || []).length < trimmed.length * 0.3 &&
                            !hasSequentialRun(trimmed) &&
                            _reWord.test(trimmed);

    if (isVersionHeader) {
      clLines.push('');
      clLines.push(`=== ${trimmed} ===`);
    } else if (isChangelogLine) {
      clLines.push(trimmed);
    }

    // ── forte_* modules ──
    _re1.lastIndex = 0;
    while ((m = _re1.exec(str)) !== null) {
      const mod = 'forte_' + m[1].toLowerCase();
      const ver = parseInt(m[2], 10);
      if (!allModules[mod]) allModules[mod] = { module: mod, versions: [], files: [] };
      if (!allModules[mod].versions.includes(ver)) allModules[mod].versions.push(ver);
      if (!allModules[mod].files.includes(filename)) allModules[mod].files.push(filename);
      addResult({ file: filename, offset, raw: str, category: 'MODULE', module: mod, ver: 'v' + ver, sw: '', hw: '', pcb: '' });
    }

    // ── PCB sw/hw ──
    _re2.lastIndex = 0;
    while ((m = _re2.exec(str)) !== null) {
      const pcb = m[1].replace(/\s+/g,' ').trim();
      for (const pair of m[2].split(',')) {
        const swm = pair.match(/sw(\d+[\d.]*)/i);
        const hwm = pair.match(/hw(\d+[\d.]*)/i);
        addResult({ file: filename, offset, raw: str, category: 'VERSION_SW', pcb, sw: swm ? swm[1] : '', hw: hwm ? hwm[1] : '', module: '', ver: pair.trim() });
      }
    }

    // ── Standalone sw / hw ──
    _re3.lastIndex = 0;
    while ((m = _re3.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'VERSION_SW', sw: m[1], hw: '', pcb: '', module: '', ver: 'sw' + m[1] });
    }
    _re4.lastIndex = 0;
    while ((m = _re4.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'VERSION_HW', sw: '', hw: m[1], pcb: '', module: '', ver: 'hw' + m[1] });
    }

    // ── Generic dotted versions ──
    _re5.lastIndex = 0;
    while ((m = _re5.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'GENERAL', ver: m[0], sw: '', hw: '', pcb: '', module: '' });
    }

    // ── Driver/device ──
    _re6.lastIndex = 0;
    while ((m = _re6.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'DRIVER', ver: m[1] + 'v' + m[2], sw: '', hw: '', pcb: '', module: m[1] });
    }

    // ── rforte_ ──
    _re7.lastIndex = 0;
    while ((m = _re7.exec(str)) !== null) {
      addResult({ file: filename, offset, raw: str, category: 'MODULE', ver: m[0], module: m[0], sw: '', hw: '', pcb: '' });
    }
  }

  if (clLines.length > 0) allChangelog.push({ file: filename, lines: clLines });
}
