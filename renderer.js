'use strict';

// ─── State ────────────────────────────────────────────────────────────────────

let runCount = 1;
let selectedPdfPath = null;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const claimInput      = document.getElementById('claimInput');
const btnStart        = document.getElementById('btnStart');
const btnHow          = document.getElementById('btnHow');
const btnConclusion   = document.getElementById('btnConclusion');
const logWindow       = document.getElementById('logWindow');
const banner          = document.getElementById('banner');
const runBadge        = document.getElementById('runBadge');
const pdfGrid         = document.getElementById('pdfGrid');
const popup           = document.getElementById('popup');

// ─── Banner helper ────────────────────────────────────────────────────────────

function setBanner(type, msg) {
  banner.className = `banner ${type}`;
  banner.textContent = msg;
}

// ─── Log ──────────────────────────────────────────────────────────────────────

function appendLog(msg) {
  logWindow.textContent += msg + '\n';
  logWindow.scrollTop = logWindow.scrollHeight;
}

// ─── PDF Slot (Main Report only) ──────────────────────────────────────────────

function buildPdfSlot() {
  pdfGrid.innerHTML = '';

  const slot = document.createElement('div');
  slot.className = 'pdf-slot';

  const label = document.createElement('div');
  label.className = 'pdf-slot-label';
  label.textContent = 'Main Report PDF';

  const btn = document.createElement('button');
  btn.className = 'pdf-browse-btn';
  btn.textContent = 'Browse PDF';

  const fname = document.createElement('div');
  fname.className = 'fname empty';
  fname.textContent = 'No file selected';

  btn.addEventListener('click', async () => {
    // Use input[type=file] trick since Electron dialog needs main process;
    // we use a hidden file input for simplicity in renderer
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = () => {
      if (input.files && input.files[0]) {
        selectedPdfPath = input.files[0].path;
        fname.textContent = input.files[0].name;
        fname.className = 'fname';
        btn.classList.add('selected');
        btn.textContent = '✔ Selected';
      }
    };
    input.click();
  });

  slot.appendChild(label);
  slot.appendChild(btn);
  slot.appendChild(fname);
  pdfGrid.appendChild(slot);
}

// ─── Show upload_documents files ──────────────────────────────────────────────

async function showUploadDocuments() {
  const files = await window.api.listPdfs();
  if (files.length === 0) {
    appendLog('⚠️ No PDFs found in Desktop/upload_documents');
    return;
  }
  appendLog(`\n📂 PDFs in Desktop/upload_documents (${files.length} files):`);
  files.forEach((f, i) => appendLog(`   ${i + 1}. ${f.name}`));
}

// ─── Start ────────────────────────────────────────────────────────────────────

btnStart.addEventListener('click', async () => {
  const claimNumber = claimInput.value.trim();

  if (!claimNumber) {
    setBanner('error', '❌ Please enter a Claim Number.');
    return;
  }
  if (!selectedPdfPath) {
    setBanner('error', '❌ Please select the Main Report PDF.');
    return;
  }

  // Disable controls during run
  btnStart.disabled = true;
  btnConclusion.style.display = 'none';
  logWindow.textContent = '';

  setBanner('running', '⏳ Running automation...');
  runBadge.textContent = `Run #${runCount}`;

  // Show folder contents in log
  await showUploadDocuments();

  appendLog('\n▶ Starting automation...\n');

  const result = await window.api.start({ pdfPath: selectedPdfPath, claimNumber });

  if (result.success) {
    setBanner('running', '⏳ Form filled — submit manually, then click Run Conclusion.');
  } else {
    setBanner('error', '❌ Automation failed. Check logs.');
    btnStart.disabled = false;
  }
});

// ─── Run Conclusion ───────────────────────────────────────────────────────────

btnConclusion.addEventListener('click', async () => {
  btnConclusion.disabled = true;
  setBanner('running', '⏳ Running conclusion...');
  appendLog('\n▶ Running conclusion...\n');

  const result = await window.api.runConclusion();

  if (result.success) {
    setBanner('success', '✅ Conclusion done — submit manually.');
    runCount++;
    runBadge.textContent = `Run #${runCount}`;
  } else {
    setBanner('error', '❌ Conclusion failed. Check logs.');
  }

  btnConclusion.disabled = false;
  btnStart.disabled = false;
});

// ─── IPC: receive logs from main ─────────────────────────────────────────────

window.api.onLog(msg => appendLog(msg));

// ─── IPC: form done → show Run Conclusion button ──────────────────────────────

window.api.onFormDone(() => {
  btnConclusion.style.display = 'inline-block';
  setBanner('stopped', '⏸ Form filled — submit manually, then click Run Conclusion.');
  appendLog('\n⏸ Waiting for manual submit. Click Run Conclusion when ready.');
});

// ─── How to Run popup ─────────────────────────────────────────────────────────

btnHow.addEventListener('click', () => {
  popup.style.display = 'flex';
  popup.setAttribute('aria-hidden', 'false');
});

popup.addEventListener('click', (e) => {
  if (e.target === popup) closePopup();
});

function closePopup() {
  popup.style.display = 'none';
  popup.setAttribute('aria-hidden', 'true');
}

// expose closePopup for the inline onclick in HTML
window.closePopup = closePopup;

// ─── Init ─────────────────────────────────────────────────────────────────────

buildPdfSlot();