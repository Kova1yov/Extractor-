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

function parseLib(buf, filename) {
  const strings = extractStrings(buf);

  const clLines = [];
  let currentVersionHeader = null;

  for (const { offset, str } of strings) {
    const cat = categorize(str);
    allStrings.push({ file: filename, offset, str, category: cat });

    const trimmed = str.trim();

    const isShortVersion = /^[Vv]\d{1,3}$/.test(trimmed);
    const isDateVersion = /^\d{8}$/.test(trimmed);
    const isVersionHeader = isShortVersion || isDateVersion;

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
      currentVersionHeader = trimmed;
      clLines.push('');
      clLines.push(`=== ${trimmed} ===`);
    } else if (isChangelogLine) {
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
