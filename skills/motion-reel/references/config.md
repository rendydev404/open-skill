# reel.config.ts reference

```ts
export const config: ReelConfig = {
  brand: { hudLabel: "ACME / LAUNCH REEL '26", logo: "logo.png" /* in public/, or null */, initials: "AC" },
  theme: makeTheme(presets.lime),            // or makeTheme({ accent: "#ff6b4a", secondary: "#1f3dff", paper?, ink? })
  sfx: true,                                 // false = silent
  scenes: [ /* in order */ ],
};
```

Every scene accepts `label` (HUD bottom-left, e.g. `"03 — SUMBER"`) and `dur` (frames, at 30 fps), which overrides the default.
Icons are lucide names (`"TrendingUp"`, `"Globe"`, `"Flame"`, `"ShieldCheck"`, ...). An unknown name falls back to a circle.

## Theme

| preset | paper | ink | accent | secondary |
|---|---|---|---|---|
| lime (reference) | #f1eee7 | #111214 | #d6f04a | #3a4cf0 |
| coral | #f5efe6 | #16120f | #ff6b4a | #1f3dff |
| ocean | #edf2f3 | #0d1b2a | #5ce1c6 | #2b59ff |
| sunset | #fbf3ea | #1d1410 | #ffb020 | #e5484d |
| violet | #f3f0f7 | #15111c | #c4f25a | #7c3aed |
| night (dark) | #0f1012 | #f1eee7 | #d6f04a | #8b7bff |

The accent is drawn behind text as a highlighter and as dot/badge fills, and text on it automatically flips to dark or light. Pick an accent that contrasts with `paper`: a pale accent on pale paper disappears.

## Scene types

Limits are the most that fit at 1920×1080 without overflowing.

| type | default dur | fields | copy limits |
|---|---|---|---|
| `spark` | 110 | `caption` | ≤ 90 chars, mono, typed under the burst |
| `word` | 120 | `word`, `mark?` (false = no highlighter), `cards[≤6] {icon,title,meta}`, `counter? {label,to}` | word ≤ 10 chars (auto-shrinks); card title ≤ 22, meta ≤ 18 |
| `tagline` | 80 | `sans`, `serif`, `mark?`, `dip?` (default true = dips to ink into the next scene) | sans ≤ 20, serif ≤ 24 |
| `bento` | 140 | `kicker`, `title`, `feature {icon,title,meta,lines[≤6],footer?}`, `cards[4] {icon,title,meta,viz,chips?,value?}`, `wide? {icon,title,meta,quote}` | title sans+serif ≤ 34; card title ≤ 20; lines ≤ 32; quote ≤ 60. `viz`: `dots` (progress dots), `chips` (3 short chips ≤ 12), `bars` (+ `value`), `clock` (+ `value`), `text` (big `value`) |
| `checklist` | 130 | `kicker`, `title`, `items[≤6] {text,ok,reason?}`, `okBadge?`, `noBadge?`, `summaryLabel` | item text ≤ 24; reason ≤ 16; badges ≤ 8 |
| `steps` | 130 | `kicker`, `title`, `steps[2–6]`, `results?[≤3]`, `resultMeta?` | step ≤ 16; result ≤ 34 |
| `formula` | 140 | `kicker`, `title`, `metrics[3–6] {label,value,hint}`, `total {label,value,suffix?}`, `footnote?` | label ≤ 14; hint ≤ 18; numbers ≤ 4 digits; footnote ≤ 60 |
| `showcase` | 150 | `line1`, `line2` (serif), `mark?`, `body?`, `card {avatar,name,status?,text,imageText?}`, `action {label,done,badge}` | line1 ≤ 12, line2 ≤ 14; body ≤ 70; card text ≤ 170 (use `\n\n` for paragraphs); imageText ≤ 26; badge ≤ 18 |
| `stats` | 120 (40 per item) | `items[≤3] {value: number \| string, label}` | numbers roll; strings ≤ 7 chars; label ≤ 26. Item 2 sits on a dark card. Ends with an accent card expanding to full frame, so put it right before `kinetic` |
| `kinetic` | 28 × words | `words[≤4] {text, sub?}` | text ≤ 9 chars (a trailing "." becomes an accent dot); sub ≤ 34. Color blocks cycle accent → secondary → paper → ink |
| `logo` | 156 | `name`, `accentWord?` (serif, secondary color), `tagline`, `mark?`, `cta?` | name ≤ 12; tagline ≤ 60; cta ≤ 34 |

## Sound effects

Cues are placed automatically per scene type: smears on entries/exits, pops for cards, ticks for steps and rolling numbers, a sweep on the checklist scan, a click and chime on the showcase action, a shimmer and outro chime on the logo. Change the levels in `buildCues()` in `src/Reel.tsx`, and the sounds themselves in `scripts/make-sfx.mjs` (then run `npm run sfx` again).
