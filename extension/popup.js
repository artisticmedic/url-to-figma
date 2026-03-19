const btn        = document.getElementById('btn');
const statusPill = document.getElementById('status');
const statusText = document.getElementById('status-text');

// ─── State machine ────────────────────────────────────────────

const STATES = {
  idle:      { label: 'Ready to capture',          btnText: 'Capture Page',   disabled: false },
  fetching:  { label: 'Fetching script…',           btnText: 'Capture Page',   disabled: true  },
  injecting: { label: 'Injecting into page…',       btnText: 'Capture Page',   disabled: true  },
  capturing: { label: 'Capturing page…',            btnText: 'Capture Page',   disabled: true  },
  done:      { label: 'Paste into Figma when ready',btnText: 'Capture Again',  disabled: false },
  error:     { label: '',                            btnText: 'Try Again',      disabled: false },
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
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    scriptText = await res.text();
  } catch (err) {
    setState('error', 'Could not reach Figma servers');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    setState('error', 'No active tab found');
    return;
  }

  // Inject the fetched script text into the page's main world.
  // Running via chrome.scripting bypasses the page's CSP — the fetch
  // above already ran in the extension context, so no page-side fetch needed.
  setState('injecting');
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world:  'MAIN',
      func:   (code) => {
        const el = document.createElement('script');
        el.textContent = code;
        (document.head || document.documentElement).appendChild(el);
        el.remove(); // script has already executed at this point
      },
      args: [scriptText],
    });
  } catch (err) {
    // Common causes: chrome:// URLs, extension pages, missing activeTab
    setState('error', 'Cannot inject into this page');
    return;
  }

  // Give the Figma capture API a moment to initialize
  await sleep(1000);

  setState('capturing');

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world:  'MAIN',
      func:   () => {
        if (typeof window.figma?.captureForDesign !== 'function') {
          return { error: 'Figma API unavailable — site may have blocked the script' };
        }
        window.figma.captureForDesign({ selector: 'body' });
        return { ok: true };
      },
    });

    if (result?.result?.error) {
      setState('error', result.result.error);
      return;
    }
  } catch (err) {
    setState('error', 'Capture failed');
    return;
  }

  // Capture runs async on the page side — give it a few seconds then
  // hand off to the user. The page toolbar shows live progress.
  await sleep(3500);
  setState('done');
}

// ─── Init ─────────────────────────────────────────────────────

btn.addEventListener('click', capture);
