// ═══════════════════════════════════════════════════════════════
// PATTERNS & CONSTANTS
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
