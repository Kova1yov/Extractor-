// ═══════════════════════════════════════════════════════════════
// CKF PARSER (ROXX — XOR 0x21 encoded)
// ═══════════════════════════════════════════════════════════════

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

  const letters = (str.match(/[a-zA-Z]/g) || []).length;
  if (letters / str.length < 0.4) return false;

  const hasSpace = /\s/.test(str);
  const words = str.trim().split(/\s+/);
  if (!hasSpace && words[0].length < 4) return false;

  let runLen = 1;
  for (let i = 1; i < str.length; i++) {
    const diff = str.charCodeAt(i) - str.charCodeAt(i - 1);
    if (diff === 1 || diff === -1) {
      runLen++;
      if (runLen >= 6) return false;
    } else {
      runLen = 1;
    }
  }

  const noise = (str.match(/[^a-zA-Z0-9\s.,\-:/()'!?]/g) || []).length;
  if (noise / str.length > 0.25) return false;

  if (!/[a-zA-Z]{3}/.test(str)) return false;

  return true;
}

function parseCkf(buf, filename) {
  const decoded = new Uint8Array(buf.length);
  for (let i = 0; i < buf.length; i++) decoded[i] = buf[i] ^ 0x21;

  const strings = extractStringsFromBuffer(decoded);

  let clusterName = '';
  const clLines = [];

  const fnMatch = filename.match(/^([A-Z0-9\-]+?)[-_]V[\d_]+\.ckf$/i);
  if (fnMatch) clusterName = fnMatch[1];

  let swVer = '', hwVer = '', bootVer = '';
  const versionStrings = [];

  for (const { offset, str } of strings) {
    const trimmed = str.trim();

    const cat = categorizeCkf(trimmed);
    allStrings.push({ file: filename, offset, str: trimmed, category: cat });

    const clusterM = trimmed.match(/^CLUSTER\s+(.+)$/i);
    if (clusterM) clusterName = clusterM[1].trim();

    const swM = trimmed.match(/^SW[.\s]*V?(\d+\.\d+[\d.]*)$/i);
    if (swM) { swVer = swM[1]; versionStrings.push({ type: 'SW', ver: swM[1] }); }

    const verM = trimmed.match(/^V(\d+\.\d+[\d.]*)$/i);
    if (verM && !swM) versionStrings.push({ type: 'VER', ver: verM[1] });

    const bootM = trimmed.match(/^BOOT\s+V?(\d+\.\d+)/i);
    if (bootM) { bootVer = bootM[1]; versionStrings.push({ type: 'BOOT', ver: bootM[1] }); }

    const genM = trimmed.match(/\bV?(\d+\.\d+[\d.]*)\b/i);
    if (genM && trimmed.length < 20) versionStrings.push({ type: 'GENERAL', ver: genM[1] });

    if (/strobe|dimmer|colour|color|fan|fixture|channel|macro|calibrat/i.test(trimmed) && trimmed.length > 3 && trimmed.length < 60) {
      addResult({ file: filename, offset, raw: trimmed, category: 'MODULE', module: trimmed, ver: '', sw: swVer, hw: hwVer, pcb: clusterName });
    }

    if (isHumanReadable(trimmed)) {
      clLines.push(trimmed);
    }
  }

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

  if (!swVer) {
    const fvM = filename.match(/V([\d_]+)\.ckf$/i);
    if (fvM) {
      const fv = fvM[1].replace(/_/g, '.');
      addResult({ file: filename, offset: 0, raw: `V${fv} (from filename)`, category: 'VERSION_SW', pcb, sw: fv, hw: '', module: '', ver: `sw${fv}` });
    }
  }

  if (clLines.length > 0) allChangelog.push({ file: filename, lines: clLines });
}
