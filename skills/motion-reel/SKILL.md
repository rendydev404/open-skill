---
name: motion-reel
description: Build an editorial "motion reel" product/feature video with Remotion. Cream paper, ink, highlighter accent, bold sans paired with italic serif, a thin HUD frame, directional motion blur, rolling numbers, 3D bento cards, kinetic type on color blocks, logo reveal, sound effects only. Colors are customizable (presets or hex). Use when the user asks for a motion graphic / promo / explainer / launch video in this style, or runs /motion-reel.
argument-hint: "[produk atau fitur] [preset: lime|coral|ocean|sunset|violet|night, atau warna hex] [durasi]"
---

# motion-reel

Makes a 1920×1080, 30 fps MP4 in the editorial motion-reel style. A ready engine lives in `template/`. You copy it, write one config file (`src/reel.config.ts`), render, review the frames, and send the video.

Arguments: `$ARGUMENTS`

## 1. Read the request

From the arguments and the conversation, work out:
- **Subject:** which product or feature. If you are inside its codebase, read the real copy (i18n files, page components, README) so the video shows what the product actually does.
- **Colors:**
  - A preset name: `lime` (the reference look), `coral`, `ocean`, `sunset`, `violet`, `night` (dark).
  - Or hex values, mapped to `accent` (highlighter, the color that pops), then `secondary` (second brand color), then optionally `paper` (background) and `ink` (text).
  - One color only means that is the accent.
  - If the project has brand tokens (for example `globals.css`), offer those as `secondary`.
  - Nothing given: use `lime`, and say so in the final message.
- **Language of the copy:** match the user's (Indonesian by default if they write in Indonesian).
- **Output folder:** the session scratchpad, unless the user names a folder. Never put it inside the product repo unless they ask.

Ask only when the subject itself is unclear. Colors and duration have defaults.

## 2. Scaffold

```bash
cp -r "<this skill dir>/template" "<out>/reel"
cd "<out>/reel" && npm install && npm run sfx
```

- `npm install` takes about 2 minutes. Run it in the background if there is other work to do.
- If the product has a logo, copy it into `public/` and set `brand.logo` to its file name. Otherwise set `brand.initials`.

## 3. Write `src/reel.config.ts`

- Set `theme: makeTheme(presets.coral)` or `makeTheme({ accent, secondary, paper, ink })`. Every other token is derived automatically.
- Choose scenes. The field list, default durations, and **copy length limits** are in `references/config.md`; read it before writing copy.
- Recommended arc (about 45 s): `spark` → `word` → `tagline` → `bento` → `checklist` → `steps` → `formula` → `showcase` → `stats` → `kinetic` → `logo`. Drop the scenes that don't fit the product. A short cut (about 20 s) is `spark` → `word` → `tagline` → `kinetic` → `logo`.
- **Facts:** only show claims the product really makes. Never invent metrics such as "10,000 users" or "99% uptime". Sample content (account names, sample posts) should be made up and clearly generic, never real customer data.
- **Headlines:** `title.sans` is the statement and `title.serif` is the italic twist. `mark` is one word from the serif part that gets the highlighter.

## 4. Check and render

```bash
npx tsc --noEmit
npm run render        # → out/reel.mp4, uses --port=3917
npm run frames        # → out/frames/sheet*.jpg, one frame every 1.5 s
```

Read every contact sheet. Look for:
- text overflowing a card or the frame
- overlapping elements
- an empty-looking scene
- a highlighter on the wrong word
- low contrast with custom colors (for example a light accent on a light paper)

Fix the config, or the engine if needed, then render **once more**. Don't loop renders.

## 5. Deliver

- Send `out/reel.mp4` with SendUserFile (`display: "render"`).
- Report duration, size, a one-line summary per scene, the colors used, and the config path for later edits.
- Say plainly that the audio was not listened to. Only timing and levels were checked.

## Style rules (when extending the engine)

- **Palette roles:** `paper` background, `ink` text and dark pills, `accent` only for highlights and live states (never large text on paper), `secondary` for color blocks and the logo accent word.
- **Typography:**
  - Inter Tight 800 for statements.
  - Instrument Serif italic for the twist.
  - Archivo Black only for kinetic words.
  - JetBrains Mono 13–20px with letter-spacing for labels and HUD.
- **Motion:**
  - Expo-out `bezier(0.16,1,0.3,1)` for entrances, in-out `bezier(0.65,0,0.35,1)` for moves.
  - Exits accelerate out with directional blur (`Smear`).
  - Text rises from a mask (`overflow: hidden` + translateY).
  - Numbers roll with vertical blur (`Roll`).
- **Transitions:** smear out/in, dip to ink after a tagline, zoom-blur through, an accent card expanding to full frame before the kinetic block, and hard cuts between kinetic words. No shake, no white flashes.
- **HUD:** label top-left, timecode top-right, section label plus progress hairline bottom-left, resolution bottom-right, corner brackets. It flips to light text on dark color blocks.
- Each scene holds readable text for at least 1.5 s.

## Remotion pitfalls (learned the hard way)

- All motion comes from `useCurrentFrame()`. CSS transitions and animations don't render.
- Port 3000 is often taken by a dev server. Always pass `--port`.
- Remotion's bundled ffmpeg lacks the `fps` and `tile` filters. Grab frames with `-ss` one at a time (`scripts/frames.mjs` does this).
- `React.useId()` contains colons. Sanitize it before using it in `url(#id)`.
- Directional blur: SVG `feGaussianBlur stdDeviation="x y"`. CSS `blur()` is only uniform.
- Audio: one `<Sequence from>` + `<Html5Audio>` per cue, with `durationInFrames` set to the clip length.
- `color-mix()` and `clip-path: circle()` work in Remotion's Chrome.
