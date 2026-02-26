// ═══════════════════════════════════════════════════════════════
// RENDER — CHANGELOG TAB + FILE CHANGELOG PANEL
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

function showFileChangelog() {
  const selectedFile = document.getElementById('file-filter')?.value;
  const panel = document.getElementById('file-changelog-panel');
  const content = document.getElementById('file-changelog-content');
  const filename = document.getElementById('changelog-filename');

  if (!selectedFile) {
    panel.style.display = 'none';
    return;
  }

  const fileChangelog = allChangelog.find(c => c.file === selectedFile);

  if (!fileChangelog || !fileChangelog.lines.length) {
    content.innerHTML = '<div class="file-cl-empty">No changelog entries found for this file.</div>';
    filename.textContent = selectedFile;
    panel.style.display = 'block';
    return;
  }

  function cleanText(text) {
    return text
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .trim();
  }

  const lines = fileChangelog.lines
    .map(line => cleanText(line))
    .filter(line => line.length > 0)
    .map(line => {
      if (/^===\s*(.+)\s*===$/.test(line)) {
        const version = line.match(/^===\s*(.+)\s*===$/)[1];
        return `<div style="font-family: var(--ui); font-size: 16px; font-weight: 700; color: var(--accent); margin: 20px 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid var(--border);">${escH(version)}</div>`;
      }

      if (line === '') {
        return '<div style="height: 10px;"></div>';
      }

      if (!/[a-zA-Z0-9]/.test(line) || line.length < 3) {
        return '';
      }

      const escaped = escH(line);
      const highlighted = escaped
        .replace(/\b(v\d+[\d.]*|sw\s*\d+|hw\s*\d+|\bRB\d+v\d+)/gi, '<span class="file-cl-highlight">$1</span>')
        .replace(/\b(added|fixed|changed|updated|removed|improved|fix|change|add|update|remove|improve|correction|optimization)/gi, '<span class="file-cl-highlight">$1</span>');

      return `<div class="file-cl-line">${highlighted}</div>`;
    })
    .filter(line => line !== '');

  if (lines.length === 0) {
    content.innerHTML = '<div class="file-cl-empty">No readable changelog entries found for this file.</div>';
  } else {
    content.innerHTML = lines.join('');
  }

  filename.textContent = selectedFile;
  panel.style.display = 'block';
}

function closeFileChangelog() {
  document.getElementById('file-changelog-panel').style.display = 'none';
}
