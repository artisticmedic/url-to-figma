const btn        = document.getElementById('btn');
const statusPill = document.getElementById('status');
const statusText = document.getElementById('status-text');

// ─── State machine ────────────────────────────────────────────

const STATES = {
  idle:      { label: 'Ready to capture',                                        btnText: 'Capture Again', disabled: false },
  fetching:  { label: 'Fetching script…',                                         btnText: 'Capture Again', disabled: true  },
  injecting: { label: 'Injecting into page…',                                     btnText: 'Capture Again', disabled: true  },
  waiting:   { label: 'If the toolbar is spinning, click it to grant clipboard access', btnText: 'Capture Again', disabled: false },
  error:     { label: '',                                                          btnText: 'Try Again',     disabled: false },
};

function setState(state, errorMsg) {
  const s = STATES[state];
  statusPill.dataset.state = state;
  statusText.textContent   = state === 'error' ? (errorMsg || 'Something went wrong') : s.label;
  btn.textContent          = s.btnText;
  btn.disabled             = s.disabled;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Capture ──────────────────────────────────────────────────

async function capture() {
  setState('fetching');

  let scriptText;
  try {
    const res = await fetch('https://mcp.figma.com/mcp/html-to-design/capture.js');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    scriptText = await res.text();
  } catch {
    setState('error', 'Could not reach Figma servers');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setState('error', 'No active tab found');
    return;
  }

  setState('injecting');
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world:  'MAIN',
      func:   (code) => {
        const el = document.createElement('script');
        el.textContent = code;
        (document.head || document.documentElement).appendChild(el);
        el.remove();
      },
      args: [scriptText],
    });
  } catch {
    setState('error', 'Cannot inject into this page');
    return;
  }

  // Give the Figma API a moment to initialize, then trigger capture.
  // captureForDesign fires and returns immediately — it shows a bar on the page
  // where the user must click "Copy to clipboard". That user click provides the
  // browser gesture required for the clipboard write; we can't do it for them.
  await sleep(1000);

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world:  'MAIN',
      func:   () => {
        if (typeof window.figma?.captureForDesign !== 'function') {
          throw new Error('Figma API unavailable');
        }
        window.figma.captureForDesign({ selector: 'body' });
      },
    });
  } catch (err) {
    setState('error', err.message === 'Figma API unavailable'
      ? 'Figma API unavailable — try reloading the page'
      : 'Capture failed');
    return;
  }

  setState('waiting');
}

// ─── Init ─────────────────────────────────────────────────────

btn.addEventListener('click', capture);
capture(); // auto-start on popup open
