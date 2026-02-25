// ═══════════════════════════════════════════════════════════════
// HELPERS & UTILITIES
// ═══════════════════════════════════════════════════════════════

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

function catBadge(cat) {
  return { VERSION_SW:'ver-sw', VERSION_HW:'ver-hw', MODULE:'ver-mod', DRIVER:'ver-drv', GENERAL:'ver-generic' }[cat] || 'ver-generic';
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

function addResult(r) {
  // Deduplicate by file+raw+ver combo
  const key = r.file + '|' + r.raw + '|' + r.ver;
  if (!addResult._seen) addResult._seen = new Set();
  if (addResult._seen.has(key)) return;
  addResult._seen.add(key);
  allResults.push(r);
}
