# URL to Figma

<!-- TODO: One-sentence hero pitch in your voice -->
A free tool to copy any local or live url and send it to Figma as an editable design. This operates with the same core features and fidelity that the paid Claude Code x Figma plug-in works.

As of March 18, 2026, this works with any Figma account (free or paid), and in both the browser or desktop app. There is no authentication gate from Figma on this call. It does not call any third-parties (other than Figma itself). It does not require any local installs. 

---

<!-- TODO: Hero video — screen recording of the full flow end-to-end -->

## The Script

TLDR: Paste script into browser console -> Copy page to clipboard using spawned toolbar -> Paste in Figma

```javascript
fetch('https://mcp.figma.com/mcp/html-to-design/capture.js')
  .then(r => r.text())
  .then(s => {
    const el = document.createElement('script');
    el.textContent = s;
    document.head.appendChild(el);
    setTimeout(() => window.figma.captureForDesign({ selector: '*' }), 1000);
  });
```
---

## Step by Step

### 1. Copy the script

Copy the code block above. (Optional: You can save this to Raycast or any clipboard manager, more below.)

### 2. Open any webpage

Navigate via browser to whatever page you want to capture: a live site or a local HTML/build.

### 3. Open DevTools console

| OS | Shortcut |
|----|----------|
| Mac (Chrome) | `Cmd + Option + J` |
| Mac (Safari) | `Cmd + Option + C` (must enable Developer menu first) |
| Windows/Linux (Chrome) | `Ctrl + Shift + J` |
| Any browser | Right-click anywhere → "Inspect" → click the "Console" tab |

You can also use the Help menu button on MacOS and search "Developer tools."
<!-- TODO: Screen recording showing how to open DevTools console -->

### 4. Paste the script and hit Enter

Navigate to the console tab and paste the script into the console. Press Enter.

If this your first time pasting into dev tools, you'll get a message asking you to allow pasting.

#### A note about the console

If you've never used the browser console before — don't panic. You'll probably see red error messages already there before you even paste anything. That's completely normal. Every website throws errors in the console — it's where browsers log behind-the-scenes issues that don't affect what you see on screen. You can ignore all of it.

#### What to expect after pressing Enter

**Success** — You'll see `Promise {<pending>}` in the console, and a toolbar will appear at the top of the page. You're good to go.

**"Allow pasting"** — If this is your first time pasting into the console, Chrome will ask you to type `allow pasting` first. Type it, press Enter, then paste the script again.

**CSP error (blocked)** — If you see red text mentioning "Content Security Policy" or "Refused to connect," the website is blocking the script from loading. This is a security restriction set by the website — there's nothing wrong on your end. Not all sites allow it.

Sites that tend to **work**: marketing sites, portfolios, documentation, blogs, most smaller sites (e.g. tailwindcss.com, dribbble.com, google.com).

Sites that tend to **block**: SaaS platforms, developer tools, and sites with strict security policies (e.g. github.com, stripe.com, linear.app, duckduckgo.com, wikipedia.org).

<!-- TODO: Screen recording of pasting into console -->

### 5. Click the element you want

An element picker will appear. Click on whatever part of the page you want to capture. You can pick the whole page or just a section.

### 6. Paste into Figma

Open Figma and paste (`Cmd + V` on Mac, `Ctrl + V` on Windows). You'll get real, editable Figma frames — not a screenshot.

<!-- TODO: Screen recording showing the paste result in Figma -->

## Quick Access with Raycast (Optional)

<!-- TODO: Brief Raycast snippet tip in your voice — save the script as a clipboard snippet for one-keystroke access -->

## How It Works

The script does four things:

1. **Fetches** Figma's capture script from `mcp.figma.com` as plain text
2. **Injects** it into the page — this bypasses Content Security Policy restrictions that would block a normal `<script>` tag
3. **Waits** one second for the script to initialize
4. **Triggers** the capture with `selector: '*'`, which opens a click-to-select picker

The capture serializes the visible DOM into a format Figma understands. It's copied to your clipboard as Figma-compatible data — when you paste, you get editable frames, not an image.

### What gets sent where

- **The script itself** is fetched from Figma's servers (`mcp.figma.com`). This is a one-time download.
- **Your page content stays local.** The DOM capture is serialized and copied to your clipboard. Nothing is sent to any server.
- **When you paste into Figma**, that's when Figma processes the data — same as pasting anything else into Figma.

## Selector Options

| Selector | Behavior |
|----------|----------|
| `'*'` | Element picker — click what you want |
| `'body'` | Capture the entire page automatically |
| `'.my-class'` | Capture a specific element by CSS selector |

## Tips & Limitations

- **The first load might "perma-load".** Click the "Copying..." at the top of the page to complete the loop.
- **Heavy pages might be slow.** Clicking a specific element is faster than capturing the whole body.
- **Fonts may not transfer.** Custom/local fonts may not render in Figma. Google Fonts usually work.
- **No interactivity.** You get static frames — no hover states, animations, or working buttons.
- **Clipboard permission.** Your browser may ask for clipboard access the first time.

<!-- TODO: Video walkthrough via Supercut (optional) -->

## Why I Made This

I've always been interested in HTML capture tools — 'Visbug' and 'Hover inspector like in Zeplin , Figma' are both daily drivers for me and helped bridge my design mind into development. Browsers already render everything, so it felt like the conversion to a design tool should be simpler than it is. Then, one night around 2 a.m., while tinkering with a Claude and Figma plugin, I discovered I could use a script to eliminate the need for session ID generation from Claude when transporting local HTML files to Figma files. Instead of going through Claude to send pages to Figma, I could inject the capture script directly into any page myself — any live URL, not just local files.

I've been smoothing things out since then, and trying to not be overexcited to share with friends along the way (lol). I just love building things and finding better ways to get things done, and I'm always trying to make design/development tools more accessible. If you find ways to improve URL to Figma, let me know. Otherwise, check out the other stuff I'm working on.

<!-- TODO: Link to portfolio / other projects -->

## Disclaimer

This project is not affiliated with, endorsed by, or officially supported by Figma. It uses Figma's publicly hosted capture script (`capture.js`) at runtime. Use of this script is subject to [Figma's Terms of Service](https://www.figma.com/tos). Figma may change or remove access to this script at any time without notice.

## License

MIT
