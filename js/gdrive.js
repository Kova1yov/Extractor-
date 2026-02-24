// ═══════════════════════════════════════════════════════════════
// GOOGLE DRIVE PICKER INTEGRATION
// ═══════════════════════════════════════════════════════════════

const GDRIVE_CLIENT_ID = '671671959584-s78bp6n09ktlruo6e1oai1rt7th0apit.apps.googleusercontent.com';
const GDRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let gdriveToken = null;
let gdriveInited = false;
let tokenClient = null;

// Loads the Google Picker library via gapi.load('picker')
function gdriveInit() {
  return new Promise((resolve, reject) => {
    if (gdriveInited) { resolve(); return; }
    gapi.load('picker', {
      callback: () => { gdriveInited = true; resolve(); },
      onerror: reject
    });
  });
}

// Checks gapi/google are loaded, inits, requests OAuth token, then calls showPicker()
function openGoogleDrivePicker() {
  if (typeof gapi === 'undefined' || typeof google === 'undefined') {
    alert('Google APIs are still loading. Please try again in a moment.');
    return;
  }

  gdriveInit().then(() => {
    if (!tokenClient) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GDRIVE_CLIENT_ID,
        scope: GDRIVE_SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error('OAuth error:', response.error);
            return;
          }
          gdriveToken = response.access_token;
          updateGdriveStatus(true);
          showPicker();
        }
      });
    }

    if (gdriveToken) {
      showPicker();
    } else {
      tokenClient.requestAccessToken();
    }
  }).catch(err => {
    console.error('gdriveInit error:', err);
    alert('Failed to initialize Google Picker.');
  });
}

// Creates a DocsView with MULTISELECT_ENABLED, title based on currentLib
function showPicker() {
  const isRoxx = currentLib === 'roxx';
  const title = isRoxx ? 'Select .ckf files' : 'Select .lib / .a / .bin files';

  const view = new google.picker.DocsView()
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false);

  const picker = new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(gdriveToken)
    .setTitle(title)
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setCallback(pickerCallback)
    .build();

  picker.setVisible(true);
}

// Filters selected files by allowed extensions, downloads and processes each
async function pickerCallback(data) {
  if (data.action !== google.picker.Action.PICKED) return;

  const isRoxx = currentLib === 'roxx';
  const allowed = isRoxx ? ['.ckf'] : ['.lib', '.a', '.bin'];

  const selected = data.docs.filter(doc => {
    const name = doc.name.toLowerCase();
    return allowed.some(ext => name.endsWith(ext));
  });

  if (!selected.length) {
    alert(`No valid ${allowed.join(', ')} files selected.`);
    return;
  }

  clearAll(true);
  fileList = selected.map(d => ({ name: d.name }));
  document.getElementById('pw').style.display = 'block';

  for (let i = 0; i < selected.length; i++) {
    const doc = selected[i];
    setProgress(i, selected.length, doc.name);
    await downloadAndProcessDriveFile(doc.id, doc.name);
  }

  setProgress(selected.length, selected.length, 'Complete');
  setTimeout(() => { document.getElementById('pw').style.display = 'none'; }, 600);

  renderSummary();
  renderVersionsTab();
  renderModulesTab();
  renderStringsTab();
  renderChangelogTab();
  buildFileFilter();

  document.getElementById('summary').style.display = 'block';
  document.getElementById('tabs').style.display = 'flex';
  document.getElementById('ctrl').style.display = 'flex';
}

// Fetches file content via Drive API and passes Uint8Array to the appropriate parser
async function downloadAndProcessDriveFile(fileId, fileName) {
  try {
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${gdriveToken}` } }
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = new Uint8Array(await resp.arrayBuffer());
    if (currentLib === 'roxx' || fileName.toLowerCase().endsWith('.ckf')) {
      parseCkf(buf, fileName);
    } else {
      parseLib(buf, fileName);
    }
  } catch (err) {
    console.error('Failed to download', fileName, err);
  }
}

// Updates the dot indicator inside the Google Drive button
function updateGdriveStatus(signedIn) {
  const btn = document.getElementById('btn-gdrive');
  if (!btn) return;
  btn.classList.toggle('connected', signedIn);
}

// Revokes token and resets status
function gdriveSignOut() {
  if (gdriveToken) {
    google.accounts.oauth2.revoke(gdriveToken, () => {});
    gdriveToken = null;
  }
  tokenClient = null;
  updateGdriveStatus(false);
}
