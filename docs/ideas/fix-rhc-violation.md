# Fix Chrome Web Store Blue Argon (RHC) Violation

## Problem Statement
How might we capture a page into Figma without fetching and executing
remote JavaScript inside the extension?

## Recommended Direction
**Vendor `capture.js` into the extension package** (Approach B-lite).
The extension currently fetches `https://mcp.figma.com/mcp/html-to-design/capture.js`
at runtime and injects it into the page (`popup.js:34-60`). Chrome Web Store
flags this as remotely-hosted code under MV3 policy (Blue Argon).

Ship a vendored copy bundled at build time. Inject from local file via
`chrome.runtime.getURL`. No runtime fetch of executable code. Resubmit.

Defer "auto-update" to v1.1 — implemented as either (a) extension version
bumps pushed via Chrome Store, or (b) a data-only version-check endpoint
that prompts the user to update. Never as runtime code download.

## Key Assumptions to Validate
- [ ] **`capture.js` is self-contained** — does not itself fetch+exec more
      remote code. Verify: `curl https://mcp.figma.com/mcp/html-to-design/capture.js`
      and grep for `fetch`, `import(`, `new Function`, `<script`. KILLER if false.
- [ ] **Figma ToS allows redistribution** of `capture.js` in a third-party
      extension. Check Figma developer terms; if unclear, email Figma.
- [ ] **No Figma HTTP/JSON API exists** that would replace the script
      injection entirely (cleaner path). Quick check: Figma MCP docs,
      network traffic on figma.com paste flow.
- [ ] **Chrome reviewer accepts bundled copy.** Some reviewers also flag
      bundled minified third-party code if origin unclear — include source
      URL + attribution comment.

## MVP Scope
**In:**
- Save `capture.js` to `extension/vendor/capture.js`
- Replace `fetch(...)` in `popup.js:34-40` with read of bundled file
- Update `manifest.json` if needed (remove `host_permissions` for mcp.figma.com if no longer required, OR keep if version-check stays)
- Bump version to `1.0.1`
- Update `README.md` + add attribution comment in vendored file
- Resubmit to Chrome Web Store with note: "Removed remotely-hosted code per Blue Argon. capture.js now bundled at version X.Y.Z."

**Out:**
- Auto-update mechanism (v1.1)
- API-based capture path (investigate later)
- Re-implementing capture logic

## Not Doing (and Why)
- **Re-implementing capture (E)** — months of work, brittle to Figma format changes
- **Bookmarklet pivot (G)** — abandons store presence, worse UX
- **Native companion (H)** — massive scope creep, no need
- **Runtime auto-fetch of capture.js (any flavor)** — same violation
- **D / redirect-to-figma** — unclear path, untested, deprioritized
- **Heavy auto-update in v1.0** — adds risk to resubmit. Ship simple first.

## Open Questions
- Does `capture.js` fetch more remote code internally? (Must answer before coding.)
- Figma ToS on redistribution?
- Is there a Figma HTTP/JSON endpoint that returns clipboard payload directly?
- How often does Figma update `capture.js` (last-modified header)?
- Does Chrome reviewer require source-mapping or readable form, or is minified OK?
