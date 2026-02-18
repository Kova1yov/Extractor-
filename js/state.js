// ═══════════════════════════════════════════════════════════════
// APPLICATION STATE
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
