# 🎂 birthday-four — full mirror / clone

A complete, self-contained copy of **https://birthday-four.vercel.app/** — every
section, animation, image, font, sound and interactive detail, running on plain
static files with **no external network calls needed**.

(Three deliberate exceptions, all harmless: `<link rel="preconnect">` DNS hints
to `fonts.gstatic.com` are left in the HTML — they load nothing; and
`birthday.html` keeps its original `balloons-js` CDN `import()` as a *fallback*
that only runs if the local `balloons.esm.js` is missing.)

No build step. No `npm install`. Just serve the folder.

---

## Quick start

Pick either server (both are included, both are dependency-free):

```bash
# Node 18+
node server.mjs            # http://localhost:3000

# or Python 3.7+
python3 server.py          # http://localhost:3000
```

Then open **http://localhost:3000**

> **Why a server and not just double-clicking `index.html`?**
> The experience is built with Next.js and splits sections into separate routes
> (`/birthday.html`, `/last.html`) plus a JSON clock endpoint. Browsers block
> those cross-file requests over the `file://` protocol. Any static host works:
> Vercel, Netlify, GitHub Pages, `npx serve`, Amazon S3, nginx — no Node needed
> on the host side.

Port override: `PORT=8080 node server.mjs` or `python3 server.py 8080`

---

## What's inside

```
birthday-four-clone/
├── index.html                      # the shell: 8 scroll-snap sections
├── birthday.html                   # section 1 — cinematic intro (standalone page)
├── last.html                       # section 8 — iMessage finale (standalone page)
├── _patch.js                       # offline shim (see "How it works")
├── server.mjs / server.py          # zero-dependency dev servers
│
├── _next/static/chunks/            # the real production JS + CSS bundles
│   ├── 2njl4qrpzxs9l.js            #   ← all page logic (GSAP, framer-motion, page-flip)
│   ├── 2or8npq1ldme6.js            #   ← framer-motion
│   ├── 2e1mk7px1q15-.js            #   ← shared motion components
│   ├── 306udcp60edd_.css           #   ← Tailwind output
│   └── …                           #   ← Next.js runtime + React
├── _next/static/media/             # Geist / Geist Mono woff2 (next/font)
│
├── ref/                            # 13 photos used across the sections
├── frames/melting_player_frame.png # music-player artwork frame
├── videos/magazine-flip.mp4        # "Film & Share" export (1.8 MB)
├── sounds/pipi-song.mp3            # the 3:17 track behind the melt player
├── bg2.jpg                         # section 1 background photo
├── curtain.svg                     # the red velvet curtain
├── balloons.esm.js                 # lazily injected balloon-physics module
├── favicon.ico
│
├── fonts/
│   ├── maglite/   Maglite.otf/.ttf         ┐
│   ├── aesthetic/ aesthetic-script.otf/.ttf├─ custom decorative faces
│   ├── elegante/  elegante-classica.ttf    ┘
│   └── google/    <self-hosted Google Fonts + woff2 subsets>
│
└── vendor/gsap.min.js              # GSAP 3.12.5 (was loaded from cdnjs)
```

---

## The 8 sections

| # | Section | What it does |
|---|---------|--------------|
| 1 | **Birthday reveal** — `birthday.html` | Full-screen animated sequence: flip-digit intro counter, velvet reveal, ember/flame particles, giant watermark that flips on click, Spotify-style melting music player |
| 2 | **Hero** | Huge `14` numeral over a darkened photo, "14Y · 8D · 13:40:09" corner clock |
| 3 | **Happy Birthday Sweety** | Editorial headline + a spiral/helix ribbon of 13 photos that scroll-drifts |
| 4 | **Polaroid wall** | Drag-and-drop polaroids ("Cutie", "Baddie", "Dream Girl", "Queen"…) on a gridded pinboard, with hearts and butterflies |
| 5 | **Birthday Magazine** | Interactive "VOGUE"-style flip book — auto-flip, rotate 16:9, film & share (records `magazine-flip.mp4`) |
| 6 | **Sunset photo** | Full-bleed parallax memory |
| 7 | **Wishing you the best day** | Serif typography break, gold accents |
| 8 | **VIP Pass + iMessage finale** | Draggable/swingable lanyard pass, then a fake iMessage thread that types "Happpyyee birthday Sweety ♥" and ends with *replay* |

Plus, before all of it: the **curtain gate** — a red velvet curtain, a
flip-card countdown (target `2026-11-11T00:00:00+05:30`), an `OPEN CURTAIN`
button, and a `PREVIEW` shortcut in the corner.

---

## How it works (and what was changed)

The original runs on **Vercel + Next.js 15 / Turbopack**. This snapshot keeps the
**production bundles byte-for-byte identical** and only adds a thin portability
layer, so what you see is the original code, not a re-implementation.

### Change 1 — `_patch.js` (one script tag added to `index.html`)

| Problem | Fix |
|---|---|
| `next/image` rewrites every `<img>` to `/_next/image?url=…&w=256&q=75`, an endpoint only the Next server exposes | Patch decodes those URLs back to the plain static path (`/ref/girl1.jpg`). Source images are already full resolution, so no quality is lost. A `MutationObserver` catches React's later DOM writes too. |
| The countdown `fetch('/api/time')` expects a server route | Patch answers it locally with `Date.now()`. |
| Next's router prefetches RSC payloads | Harmless on a static host; also covered by the servers below. |

Both bundled servers also emulate those two endpoints natively, so `_patch.js`
and the servers are belt-and-braces — either alone is enough.

### Change 2 — fonts self-hosted

7 `fonts.googleapis.com` stylesheets were downloaded, their `woff2` files
localised into `fonts/google/`, and every reference rewritten. Rendered output
is identical; the page now works with **no internet connection**.

### Change 3 — GSAP self-hosted

`cdnjs.cloudflare.com/.../gsap/3.12.5/gsap.min.js` → `vendor/gsap.min.js`
(same version, same file).

### Everything else is untouched

React/Next runtime, Tailwind CSS, framer-motion, GSAP timelines, the CSS
page-flip engine, canvas drawing for the polaroid captions, the balloon physics
module, all 13 photos, the song, the video, the curtain SVG, the custom
decorative fonts — all original.

---

## Verification

- ✅ 8/8 sections render, 0 console errors, 0 network failures
- ✅ Side-by-side screenshots at 1440×900 match the live site section by section
  (see `docs/screenshots/`)
- ✅ Gate → curtain → preview flow works, countdown ticks
- ✅ Music player plays, magazine flips, polaroids drag, VIP pass swings
- ✅ Works fully offline after load

---

## Customising it

All the personal bits live in the bundle and in the two standalone pages.

| Want to change | Where |
|---|---|
| Name ("Sweety") everywhere | `_next/static/chunks/2njl4qrpzxs9l.js` (search `Sweety`), plus `birthday.html`, `last.html`, `index.html` |
| Countdown date | Search `2026-11-11T00:00:00+05:30` in `_next/static/chunks/2njl4qrpzxs9l.js` |
| Photos | drop replacements into `ref/` keeping the filenames `girl.jpg`, `girl1.jpg` … `girl11.jpg`, `heart.jpg` |
| Song | replace `sounds/pipi-song.mp3` |
| Magazine aspect / film | `videos/magazine-flip.mp4` + the flip-book code in chunk `2njl4qrpzxs9l.js` |
| Polaroid captions ("Cutie", "Queen"…) | search the caption strings in chunk `2njl4qrpzxs9l.js` |

The bundles are minified but not obfuscated — the strings and structure are
readable.

---

## Credits / notice

The design, copy, photographs and audio are the work of whoever built
**birthday-four.vercel.app**. This folder is a technical mirror captured for
reference, offline viewing and personal use. Replace the photos, song and text
with your own before publishing anything derived from it — and keep GSAP's
license (`vendor/gsap.min.js`) intact.

Libraries bundled: React · Next.js · framer-motion · GSAP 3.12.5 · Tailwind CSS
