import React from "react";
import { AbsoluteFill, Easing, Html5Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/InterTight";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import * as Icons from "lucide-react";
import { config } from "./reel.config";
import { luminance, rgba } from "./theme";
import type { Scene, Title } from "./types";

/**
 * Editorial motion-reel engine. Everything is driven by src/reel.config.ts; this file only knows how to draw each
 * scene type. All motion comes from useCurrentFrame() (no CSS transitions), directional motion blur via SVG filters.
 */

export const FPS = 30;
const W = 1920;
const H = 1080;
const C = config.theme;

const { fontFamily: SANS } = loadSans("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });
const { fontFamily: SERIF } = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: BLACK } = loadBlack("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] });

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const EIN = Easing.bezier(0.7, 0, 0.84, 0);
const tw = (f: number, i: number[], o: number[], e: (t: number) => number = EXPO) => interpolate(f, i, o, { ...CLAMP, easing: e });
const SHADOW = C.isDark ? "0 18px 40px -18px rgba(0,0,0,0.7)" : `0 1px 1px ${rgba(C.ink, 0.04)}, 0 18px 40px -18px ${rgba(C.ink, 0.28)}`;
const onInk = (a: number) => rgba(C.paper, a);

type IconT = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
const icon = (name: string): IconT => ((Icons as unknown as Record<string, IconT>)[name] ?? Icons.Circle) as IconT;

/* ================================================================== timeline */

const DEFAULT_DUR: Record<Scene["type"], number> = { spark: 110, word: 120, tagline: 80, bento: 140, checklist: 130, steps: 130, formula: 140, showcase: 150, stats: 120, kinetic: 28, logo: 156 };
const SCENES = config.scenes;
const DURS = SCENES.map((s) => s.dur ?? (s.type === "kinetic" ? 28 * s.words.length : DEFAULT_DUR[s.type]));
const FROM = DURS.map((_, i) => DURS.slice(0, i).reduce((a, b) => a + b, 0));
export const REEL_DURATION = DURS.reduce((a, b) => a + b, 0);
const sceneAt = (f: number) => {
  let i = 0;
  while (i < FROM.length - 1 && f >= FROM[i + 1]) i++;
  return i;
};
const label = (i: number) => SCENES[i].label ?? `${String(i + 1).padStart(2, "0")} — ${SCENES[i].type.toUpperCase()}`;

/* ================================================================== primitives */

/** Directional motion blur (x / y separately) using an SVG feGaussianBlur. */
function Smear({ x = 0, y = 0, children, style }: { x?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const id = "sm" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const on = x > 0.4 || y > 0.4;
  return (
    <div style={style}>
      {on ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={`${x} ${y}`} />
          </filter>
        </svg>
      ) : null}
      <div style={{ filter: on ? `url(#${id})` : undefined }}>{children}</div>
    </div>
  );
}

/** Highlighter stroke swept in from the left behind a word. */
function Mark({ p, children }: { p: number; children: React.ReactNode }) {
  return (
    <span style={{ position: "relative", display: "inline-block", isolation: "isolate", color: C.ink }}>
      <span style={{ position: "absolute", left: "-3%", bottom: "8%", height: "46%", width: `${p * 106}%`, background: C.accent, borderRadius: 6, zIndex: -1, transform: "skewX(-6deg)" }} />
      {children}
    </span>
  );
}

const withMark = (text: string, mark: string | undefined, p: number) =>
  text.split(" ").map((w, i) => (
    <React.Fragment key={i}>
      {i ? " " : ""}
      {mark && w.replace(/[.,!?]/g, "") === mark.replace(/[.,!?]/g, "") ? <Mark p={p}>{w}</Mark> : w}
    </React.Fragment>
  ));

function Paper() {
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: "96px 96px", opacity: 0.35 }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 55%, ${rgba(C.ink, 0.07)} 100%)` }} />
    </AbsoluteFill>
  );
}

function hudIsLight(frame: number) {
  const i = sceneAt(frame);
  const s = SCENES[i];
  if (s.type !== "kinetic") return C.isDark;
  const k = Math.min(s.words.length - 1, Math.floor((frame - FROM[i]) / 28));
  return luminance(KIN[k % KIN.length].bg) < 0.3;
}

function Hud() {
  const frame = useCurrentFrame();
  const light = hudIsLight(frame);
  const col = light ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.55)";
  const i = sceneAt(frame);
  const sec = Math.floor(frame / FPS);
  const tc = `TC 00:${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}:${String(frame % FPS).padStart(2, "0")}`;
  const mono: React.CSSProperties = { fontFamily: MONO, fontWeight: 500, fontSize: 15, letterSpacing: 2, color: col };
  const bar = tw(frame - FROM[i], [0, DURS[i]], [0, 1], Easing.linear);
  const corner = (l: boolean, t: boolean): React.CSSProperties => ({
    position: "absolute",
    [l ? "left" : "right"]: 34,
    [t ? "top" : "bottom"]: 30,
    width: 22,
    height: 22,
    [l ? "borderLeft" : "borderRight"]: `1.5px solid ${col}`,
    [t ? "borderTop" : "borderBottom"]: `1.5px solid ${col}`,
  });
  return (
    <AbsoluteFill style={{ opacity: tw(frame, [8, 30], [0, 1]), pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 70, top: 40, ...mono }}>{config.brand.hudLabel}</div>
      <div style={{ position: "absolute", right: 70, top: 40, display: "flex", alignItems: "center", gap: 10, ...mono }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: "#e5484d" }} />
        {tc}
      </div>
      <div style={{ position: "absolute", left: 70, bottom: 44, ...mono }}>{label(i)}</div>
      <div style={{ position: "absolute", left: 300, bottom: 51, width: 240, height: 1.5, background: light ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)" }}>
        <div style={{ width: `${bar * 100}%`, height: "100%", background: col }} />
      </div>
      <div style={{ position: "absolute", right: 70, bottom: 44, ...mono }}>1920 × 1080 · 30 FPS</div>
      <div style={corner(true, true)} />
      <div style={corner(false, true)} />
      <div style={corner(true, false)} />
      <div style={corner(false, false)} />
    </AbsoluteFill>
  );
}

function Headline({ title, at = 4, size = 70, markAt = 40 }: { title: Title; at?: number; size?: number; markAt?: number }) {
  const frame = useCurrentFrame();
  const p = tw(frame, [at, at + 22], [0, 1]);
  const q = tw(frame, [at + 5, at + 27], [0, 1]);
  const m = tw(frame, [markAt, markAt + 16], [0, 1], INOUT);
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: size * 0.25, overflow: "hidden", paddingBottom: size * 0.18 }}>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: -size * 0.035, color: C.ink, transform: `translateY(${(1 - p) * size * 1.3}px)`, display: "inline-block" }}>{title.sans}</span>
      <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size * 1.08, color: C.inkSoft, transform: `translateY(${(1 - q) * size * 1.3}px)`, display: "inline-block", whiteSpace: "nowrap" }}>{withMark(title.serif, title.mark, m)}</span>
    </div>
  );
}

function Kicker({ text }: { text: string }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, opacity: tw(frame, [0, 14], [0, 1]), fontFamily: MONO, fontWeight: 500, fontSize: 16, letterSpacing: 3, color: C.muted }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: C.accentDeep }} />
      {text}
    </div>
  );
}

function TitleBlock({ kicker, title, markAt }: { kicker: string; title: Title; markAt: number }) {
  return (
    <div style={{ position: "absolute", top: 120, width: W }}>
      <Kicker text={kicker} />
      <div style={{ marginTop: 14 }}>
        <Headline title={title} markAt={markAt} />
      </div>
    </div>
  );
}

function MiniCard({ iconName, title, meta, w = 300 }: { iconName: string; title: string; meta: string; w?: number }) {
  const I = icon(iconName);
  return (
    <div style={{ width: w, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW, boxSizing: "border-box" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <I size={20} color={C.accent} strokeWidth={2.4} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 21, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 1, color: C.faint, marginTop: 2, whiteSpace: "nowrap" }}>{meta}</div>
      </div>
    </div>
  );
}

/** Number that rolls from→to with vertical motion blur proportional to its speed. */
function Roll({ from, to, start, end, style }: { from: number; to: number; start: number; end: number; style?: React.CSSProperties }) {
  const frame = useCurrentFrame();
  const v = tw(frame, [start, end], [from, to], INOUT);
  const v2 = tw(frame + 1, [start, end], [from, to], INOUT);
  const speed = (Math.abs(v2 - v) / Math.max(1, Math.abs(to - from))) * 100;
  return (
    <Smear y={Math.min(10, speed * 2.2)} style={{ display: "inline-block" }}>
      <span style={style}>{Math.round(v).toLocaleString("id-ID")}</span>
    </Smear>
  );
}

type Pt = { f: number; x: number; y: number };
function Cursor({ points, clicks = [] }: { points: Pt[]; clicks?: number[] }) {
  const frame = useCurrentFrame();
  const fs = points.map((p) => p.f);
  if (frame < fs[0]) return null;
  const x = interpolate(frame, fs, points.map((p) => p.x), { ...CLAMP, easing: INOUT });
  const y = interpolate(frame, fs, points.map((p) => p.y), { ...CLAMP, easing: INOUT });
  let press = 1;
  const rip: React.ReactNode[] = [];
  clicks.forEach((c, i) => {
    const d = frame - c;
    if (d >= 0 && d < 10) press = Math.min(press, interpolate(d, [0, 4, 10], [1, 0.86, 1]));
    if (d >= 0 && d < 22) {
      const r = tw(d, [0, 22], [6, 46]);
      rip.push(<div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `2px solid ${C.ink}`, opacity: tw(d, [0, 22], [0.6, 0]) }} />);
    }
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {rip}
      <svg width={34} height={46} viewBox="0 0 24 34" style={{ position: "absolute", left: x - 3, top: y - 2, opacity: tw(frame, [fs[0], fs[0] + 8], [0, 1]), transform: `scale(${press})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))" }}>
        <path d="M2 1 L2 27 L8.5 21 L13 32 L17.5 30 L13 19.5 L22 19.5 Z" fill={C.ink} stroke={C.paper} strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
}

/* ================================================================== scenes */

function SparkScene({ s }: { s: Extract<Scene, { type: "spark" }> }) {
  const frame = useCurrentFrame();
  const fall = spring({ frame: frame - 10, fps: FPS, config: { damping: 9, stiffness: 110, mass: 0.9 } });
  const dotY = interpolate(fall, [0, 1], [-60, H / 2]);
  const burst = tw(frame, [42, 70], [0, 1]);
  const contract = tw(frame, [82, 100], [0, 1], INOUT);
  const open = burst * (1 - contract);
  const vanish = tw(frame, [102, 110], [1, 0], EIN);
  const dotSize = (22 + open * 14) * vanish;
  const chars = Math.floor(tw(frame, [50, 92], [0, s.caption.length], Easing.linear));
  return (
    <AbsoluteFill>
      {frame >= 10 && frame < 46 ? <div style={{ position: "absolute", left: W / 2 - 40 * fall, top: H / 2 + 34, width: 80 * fall, height: 10, borderRadius: "50%", background: rgba(C.ink, 0.12), filter: "blur(4px)" }} /> : null}
      {[420, 560].map((r, k) => {
        const rr = r * tw(frame, [44 + k * 4, 80], [0, 1]) * (1 - contract * 0.4);
        return <div key={r} style={{ position: "absolute", left: W / 2 - rr, top: H / 2 - rr, width: rr * 2, height: rr * 2, borderRadius: "50%", border: `1.5px solid ${k ? rgba(C.ink, 0.18) : C.accent}`, opacity: open }} />;
      })}
      <div style={{ position: "absolute", left: W / 2 - 230, top: H / 2 - 70, width: 460, height: 140, borderRadius: "50%", border: `2px solid ${C.ink}`, opacity: open * 0.9, transform: `rotate(${-18 + frame * 0.6}deg) scale(${0.6 + open * 0.4})` }} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + frame * 0.012;
        const r = 150 * open;
        const sz = (18 + (i % 3) * 5) * Math.min(1, open * 1.6);
        return <div key={i} style={{ position: "absolute", left: W / 2 + Math.cos(a) * r - sz / 2, top: H / 2 + Math.sin(a) * r - sz / 2, width: sz, height: sz, borderRadius: "50%", background: C.ink }} />;
      })}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: W / 2, top: H / 2 - 3, width: 74 * open, height: 6, borderRadius: 3, background: C.ink, transformOrigin: "0 50%", transform: `rotate(${i * 45 + frame * 0.3}deg) translateX(22px)` }} />
      ))}
      {Array.from({ length: 16 }, (_, i) => {
        const a = random(`sa${i}`) * Math.PI * 2;
        const r = (240 + random(`sr${i}`) * 260) * open;
        const sz = 4 + random(`ss${i}`) * 6;
        return <div key={i} style={{ position: "absolute", left: W / 2 + Math.cos(a) * r, top: H / 2 + Math.sin(a) * r, width: sz, height: sz, borderRadius: "50%", background: i % 4 ? C.ink : C.accentDeep, opacity: open * 0.8 }} />;
      })}
      <div style={{ position: "absolute", left: W / 2 - dotSize / 2, top: (frame < 46 ? dotY : H / 2) - dotSize / 2, width: dotSize, height: dotSize, borderRadius: "50%", background: C.accent }} />
      <div style={{ position: "absolute", top: H / 2 + 230, width: W, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: C.muted, opacity: 1 - contract }}>
        {s.caption.slice(0, chars)}
        {chars > 0 && chars < s.caption.length ? <span style={{ background: C.ink, color: C.ink }}>_</span> : null}
      </div>
    </AbsoluteFill>
  );
}

const CARD_SPOTS = [
  { x: 230, y: 250 },
  { x: 1390, y: 210 },
  { x: 160, y: 640 },
  { x: 1450, y: 600 },
  { x: 470, y: 840 },
  { x: 1160, y: 850 },
];

function WordScene({ s }: { s: Extract<Scene, { type: "word" }> }) {
  const frame = useCurrentFrame();
  const enter = tw(frame, [0, 18], [0, 1]);
  const exit = tw(frame, [102, 118], [0, 1], EIN);
  const mark = tw(frame, [58, 76], [0, 1], INOUT);
  const size = s.word.length > 8 ? Math.max(170, 330 - (s.word.length - 8) * 22) : 330;
  return (
    <AbsoluteFill>
      {s.cards.slice(0, 6).map((c, i) => {
        const spot = CARD_SPOTS[i];
        const p = tw(frame, [8 + i * 5, 30 + i * 5], [0, 1]);
        const left = spot.x < W / 2;
        return (
          <Smear
            key={i}
            x={(1 - p) * 18 + exit * 40}
            y={(1 - p) * 6}
            style={{ position: "absolute", left: spot.x + Math.sin(frame / 40 + i) * 10 + exit * (left ? -700 : 700) + (1 - p) * (left ? -120 : 120), top: spot.y + Math.cos(frame / 35 + i * 2) * 8, opacity: p * (1 - exit), transform: `rotate(${(i % 2 ? 3 : -3) * (1 - p * 0.5)}deg)` }}
          >
            <MiniCard iconName={c.icon} title={c.title} meta={c.meta} w={290} />
          </Smear>
        );
      })}
      <Smear x={(1 - enter) * 40 + exit * 60} style={{ position: "absolute", top: 540 - size * 0.72, width: W, display: "flex", justifyContent: "center", transform: `translateX(${(1 - enter) * 520 - exit * 900}px)`, opacity: Math.min(1, enter * 1.4) }}>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size, lineHeight: 1, letterSpacing: -size * 0.018, color: C.ink, whiteSpace: "nowrap" }}>{s.mark === false ? s.word : <Mark p={mark}>{s.word}</Mark>}</span>
      </Smear>
      {s.counter ? (
        <div style={{ position: "absolute", top: 690, width: W, display: "flex", justifyContent: "center", opacity: tw(frame, [16, 28], [0, 1]) * (1 - exit), transform: `translateY(${tw(frame, [16, 30], [20, 0]) + exit * 40}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px", borderRadius: 999, background: C.ink }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: C.accent }} />
            <span style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: onInk(0.6) }}>{s.counter.label}</span>
            <Roll from={0} to={s.counter.to} start={20} end={92} style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color: C.accent, minWidth: 64, display: "inline-block" }} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function TaglineScene({ s, dur }: { s: Extract<Scene, { type: "tagline" }>; dur: number }) {
  const frame = useCurrentFrame();
  const a = tw(frame, [0, 18], [0, 1]);
  const b = tw(frame, [8, 26], [0, 1]);
  const m = tw(frame, [28, 44], [0, 1], INOUT);
  const dip = s.dip === false ? 0 : tw(frame, [dur - 16, dur - 4], [0, 1], INOUT);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 360, width: W, textAlign: "center", overflow: "hidden" }}>
        <Smear y={(1 - a) * 12} style={{ transform: `translateY(${(1 - a) * 110}px)` }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 108, letterSpacing: -4, color: C.ink }}>{s.sans}</span>
        </Smear>
      </div>
      <div style={{ position: "absolute", top: 490, width: W, textAlign: "center", overflow: "hidden", paddingBottom: 20 }}>
        <Smear y={(1 - b) * 12} style={{ transform: `translateY(${(1 - b) * 130}px)` }}>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 124, color: C.inkSoft }}>{withMark(s.serif, s.mark, m)}</span>
        </Smear>
      </div>
      <AbsoluteFill style={{ background: C.ink, opacity: dip }} />
    </AbsoluteFill>
  );
}

function BentoCard({ i, x, y, w, h, dark = false, children }: { i: number; x: number; y: number; w: number; h: number; dark?: boolean; children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const p = tw(frame, [10 + i * 6, 38 + i * 6], [0, 1]);
  return (
    <Smear y={(1 - p) * 10} style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: p, transform: `translateY(${(1 - p) * 70}px)` }}>
      <div style={{ width: w, height: h, borderRadius: 24, background: dark ? C.ink : C.card, border: dark ? "none" : `1px solid ${C.line}`, boxShadow: SHADOW, padding: 24, boxSizing: "border-box", position: "relative", overflow: "hidden" }}>{children}</div>
    </Smear>
  );
}

function CardHead({ iconName, title, meta, dark }: { iconName: string; title: string; meta: string; dark?: boolean }) {
  const I = icon(iconName);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: dark ? C.accent : C.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <I size={21} color={dark ? C.accentInk : C.accent} strokeWidth={2.4} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 25, color: dark ? C.paper : C.ink, whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 1.5, color: dark ? onInk(0.5) : C.faint, whiteSpace: "nowrap" }}>{meta}</div>
      </div>
    </div>
  );
}

function Viz({ c }: { c: Extract<Scene, { type: "bento" }>["cards"][number] }) {
  const frame = useCurrentFrame();
  if (c.viz === "dots")
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 30 }}>
        {Array.from({ length: 6 }, (_, k) => {
          const on = frame >= 40 + k * 8;
          return (
            <React.Fragment key={k}>
              {k ? <div style={{ width: 34, height: 2, background: on ? C.ink : C.line }} /> : null}
              <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid ${C.ink}`, background: on ? C.accent : "transparent" }} />
            </React.Fragment>
          );
        })}
      </div>
    );
  if (c.viz === "chips")
    return (
      <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
        {(c.chips ?? []).slice(0, 3).map((t, k) => (
          <span key={t} style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, padding: "7px 12px", borderRadius: 999, background: k ? C.line : C.accent, color: k ? C.ink : C.accentInk, opacity: tw(frame, [44 + k * 8, 56 + k * 8], [0, 1]) }}>
            {t}
          </span>
        ))}
      </div>
    );
  if (c.viz === "bars")
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 70, marginTop: 18 }}>
        {[22, 30, 26, 34, 28, 70].map((v, k) => (
          <div key={k} style={{ width: 28, height: v * tw(frame, [48 + k * 4, 70 + k * 4], [0, 1]), borderRadius: 5, background: k === 5 ? C.accent : C.ink, opacity: k === 5 ? 1 : 0.85 }} />
        ))}
        {c.value ? <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, color: C.ink, marginLeft: 12, opacity: tw(frame, [76, 88], [0, 1]) }}>{c.value}</span> : null}
      </div>
    );
  if (c.viz === "clock")
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24 }}>
        <div style={{ width: 54, height: 54, borderRadius: 27, border: `2.5px solid ${C.ink}`, position: "relative" }}>
          <div style={{ position: "absolute", left: 25, top: 8, width: 3, height: 19, background: C.ink, transformOrigin: "50% 100%", transform: `rotate(${frame * 4}deg)`, borderRadius: 2 }} />
        </div>
        {c.value ? <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, color: C.ink }}>{c.value}</span> : null}
      </div>
    );
  return <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: C.ink, marginTop: 26, opacity: tw(frame, [50, 64], [0, 1]) }}>{c.value}</div>;
}

function BentoScene({ s }: { s: Extract<Scene, { type: "bento" }> }) {
  const frame = useCurrentFrame();
  const tilt = tw(frame, [0, 46], [0, 1]);
  const exit = tw(frame, [122, 138], [0, 1], EIN);
  const pos = [
    { x: 545, y: 0, w: 450 },
    { x: 1020, y: 0, w: 480 },
    { x: 545, y: 225, w: 450 },
    { x: 1020, y: 225, w: 480 },
  ];
  return (
    <AbsoluteFill>
      <div style={{ opacity: 1 - exit }}>
        <TitleBlock kicker={s.kicker} title={s.title} markAt={40} />
      </div>
      <Smear y={exit * 40} style={{ position: "absolute", left: 210, top: 360, width: 1500, height: 600, perspective: 2400, transform: `translateY(${-exit * 300}px)`, opacity: 1 - exit }}>
        <div style={{ position: "relative", width: 1500, height: 600, transform: `rotateX(${interpolate(tilt, [0, 1], [38, 16])}deg) rotateZ(${interpolate(tilt, [0, 1], [-10, -5])}deg) translateY(${(1 - tilt) * 90}px)` }}>
          <BentoCard i={0} x={0} y={0} w={520} h={430} dark>
            <CardHead iconName={s.feature.icon} title={s.feature.title} meta={s.feature.meta} dark />
            <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
              {s.feature.lines.slice(0, 6).map((l, k) => {
                const n = Math.floor(tw(frame, [30 + k * 10, 46 + k * 10], [0, l.length], Easing.linear));
                return (
                  <div key={k} style={{ fontFamily: MONO, fontSize: 19, color: k === 1 ? C.accent : onInk(0.78), whiteSpace: "nowrap", overflow: "hidden" }}>
                    {l.slice(0, n)}
                  </div>
                );
              })}
            </div>
            {s.feature.footer ? <div style={{ position: "absolute", left: 24, bottom: 22, fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: onInk(0.4) }}>{s.feature.footer}</div> : null}
          </BentoCard>
          {s.cards.slice(0, 4).map((c, k) => (
            <BentoCard key={c.title} i={k + 1} x={pos[k].x} y={pos[k].y} w={pos[k].w} h={205}>
              <CardHead iconName={c.icon} title={c.title} meta={c.meta} />
              <Viz c={c} />
            </BentoCard>
          ))}
          {s.wide ? (
            <BentoCard i={5} x={0} y={455} w={1500} h={125}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <CardHead iconName={s.wide.icon} title={s.wide.title} meta={s.wide.meta} />
                <div style={{ flex: 1, fontFamily: SERIF, fontStyle: "italic", fontSize: 34, color: C.muted, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>“{s.wide.quote}”</div>
              </div>
            </BentoCard>
          ) : null}
        </div>
      </Smear>
    </AbsoluteFill>
  );
}

function ChecklistScene({ s }: { s: Extract<Scene, { type: "checklist" }> }) {
  const frame = useCurrentFrame();
  const items = s.items.slice(0, 6);
  const cols = Math.min(3, items.length);
  const CW = 440;
  const GAP = 20;
  const gridW = cols * CW + (cols - 1) * GAP;
  const GX = (W - gridW) / 2;
  const GY = 380;
  const span = gridW + 80;
  const scanX = tw(frame, [30, 86], [GX - 40, GX + gridW + 40], INOUT);
  const scanOn = tw(frame, [26, 32, 84, 92], [0, 1, 1, 0], Easing.linear);
  const judgeFrame = (cx: number) => Math.round(30 + ((cx - (GX - 40)) / span) * 56);
  const passed = items.filter((it, i) => it.ok && scanX > GX + (i % cols) * (CW + GAP) + CW / 2).length;
  const exit = tw(frame, [116, 130], [0, 1], EIN);
  const rows = Math.ceil(items.length / cols);
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + exit * 0.12})`, filter: exit > 0.02 ? `blur(${exit * 16}px)` : undefined, opacity: 1 - exit }}>
      <TitleBlock kicker={s.kicker} title={s.title} markAt={96} />
      {items.map((it, i) => {
        const x = GX + (i % cols) * (CW + GAP);
        const y = GY + Math.floor(i / cols) * 150;
        const p = tw(frame, [8 + i * 4, 32 + i * 4], [0, 1]);
        const judged = scanX > x + CW / 2;
        const j = judged ? tw(frame - judgeFrame(x + CW / 2), [0, 12], [0, 1]) : 0;
        const bad = !it.ok && judged;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y + (bad ? j * 10 : 0), width: CW, height: 128, opacity: p * (bad ? 1 - j * 0.45 : 1), transform: `translateY(${(1 - p) * 40}px)` }}>
            <div style={{ width: "100%", height: "100%", boxSizing: "border-box", borderRadius: 18, background: C.card, border: `1px solid ${judged && it.ok ? C.accentDeep : C.line}`, boxShadow: SHADOW, padding: "20px 22px", position: "relative" }}>
              <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: C.faint }}>ITEM {String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 26, color: bad ? C.faint : C.ink, marginTop: 8, textDecoration: bad ? "line-through" : undefined, textDecorationThickness: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300 }}>{it.text}</div>
              {bad && it.reason ? <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: C.danger, marginTop: 6, opacity: j }}>{it.reason}</div> : null}
              <div style={{ position: "absolute", right: 18, top: 16, opacity: j, transform: `scale(${0.6 + 0.4 * j})` }}>
                {judged ? (
                  it.ok ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, background: C.accent, fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: C.accentInk }}>
                      <Icons.Check size={14} color={C.accentInk} strokeWidth={3} /> {s.okBadge ?? "OK"}
                    </span>
                  ) : (
                    <span style={{ padding: "5px 11px", borderRadius: 999, background: C.ink, fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: C.paper }}>{s.noBadge ?? "DITOLAK"}</span>
                  )
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: scanX - 2, top: GY - 30, width: 4, height: rows * 150 + 30, borderRadius: 2, background: C.ink, opacity: scanOn }} />
      <div style={{ position: "absolute", left: scanX - 160, top: GY - 30, width: 160, height: rows * 150 + 30, background: `linear-gradient(90deg, transparent, ${C.accent})`, opacity: scanOn * 0.35 }} />
      <div style={{ position: "absolute", top: GY + rows * 150 + 80, width: W, display: "flex", justifyContent: "center", opacity: tw(frame, [86, 98], [0, 1]), transform: `translateY(${tw(frame, [86, 100], [24, 0])}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 30px", borderRadius: 999, background: C.ink }}>
          <span style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: onInk(0.6) }}>{s.summaryLabel}</span>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: C.accent }}>
            {passed} / {items.length}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function StepsScene({ s }: { s: Extract<Scene, { type: "steps" }> }) {
  const frame = useCurrentFrame();
  const n = Math.max(2, Math.min(6, s.steps.length));
  const span = 1320;
  const X0 = (W - span) / 2;
  const GAP = span / (n - 1);
  const Y = 470;
  const line = tw(frame, [22, 96], [0, 1], INOUT);
  const exit = tw(frame, [116, 130], [0, 1], EIN);
  const results = (s.results ?? []).slice(0, 3);
  return (
    <AbsoluteFill>
      <div style={{ opacity: 1 - exit }}>
        <TitleBlock kicker={s.kicker} title={s.title} markAt={100} />
      </div>
      <Smear x={exit * 50} style={{ position: "absolute", inset: 0, transform: `translateX(${exit * 700}px)`, opacity: 1 - exit }}>
        <div style={{ position: "absolute", left: X0, top: Y - 1, width: span, height: 2, background: C.line }} />
        <div style={{ position: "absolute", left: X0, top: Y - 2, width: span * line, height: 4, borderRadius: 2, background: C.ink }} />
        {s.steps.slice(0, n).map((st, i) => {
          const at = 22 + (74 * i) / (n - 1);
          const on = frame >= at;
          const pop = spring({ frame: frame - at, fps: FPS, config: { damping: 14, stiffness: 180 } });
          const enter = tw(frame, [6 + i * 4, 26 + i * 4], [0, 1]);
          return (
            <div key={st} style={{ position: "absolute", left: X0 + i * GAP - 120, top: Y - 34, width: 240, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: enter, transform: `translateY(${(1 - enter) * 30}px)` }}>
              <div style={{ width: 68, height: 68, borderRadius: 34, background: on ? C.ink : C.paper, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${on ? 0.85 + 0.15 * pop : 1})` }}>
                {on ? <Icons.Check size={30} color={C.accent} strokeWidth={3} /> : <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.ink }}>0{i + 1}</span>}
              </div>
              <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 25, color: C.ink, textAlign: "center" }}>{st}</span>
            </div>
          );
        })}
        <div style={{ position: "absolute", top: 690, width: W, display: "flex", justifyContent: "center", gap: 22 }}>
          {results.map((t, i) => {
            const p = tw(frame, [98 + i * 6, 118 + i * 6], [0, 1]);
            return (
              <Smear key={t} y={(1 - p) * 14} style={{ opacity: p, transform: `translateY(${(1 - p) * 90}px)` }}>
                <MiniCard iconName="Lightbulb" title={t} meta={`${s.resultMeta ?? "HASIL"} 0${i + 1}`} w={420} />
              </Smear>
            );
          })}
        </div>
      </Smear>
    </AbsoluteFill>
  );
}

function FormulaScene({ s }: { s: Extract<Scene, { type: "formula" }> }) {
  const frame = useCurrentFrame();
  const ms = s.metrics.slice(0, 6);
  const n = ms.length;
  const GAP = 34;
  const CW = Math.min(250, (1600 - GAP * (n - 1)) / n);
  const X0 = W / 2 - (CW * n + GAP * (n - 1)) / 2;
  const Y = 340;
  const lines = tw(frame, [58, 88], [0, 1], INOUT);
  const pill = tw(frame, [84, 100], [0, 1]);
  const exit = tw(frame, [124, 140], [0, 1], EIN);
  const sweep = tw(frame, [14, 60], [0, 1], INOUT);
  return (
    <AbsoluteFill style={{ opacity: 1 - exit, filter: exit > 0.02 ? `blur(${exit * 18}px)` : undefined, transform: `scale(${1 - exit * 0.04})` }}>
      <TitleBlock kicker={s.kicker} title={s.title} markAt={104} />
      {ms.map((m, i) => {
        const p = tw(frame, [10 + i * 6, 34 + i * 6], [0, 1]);
        const x = X0 + i * (CW + GAP);
        const lit = sweep * n > i;
        return (
          <React.Fragment key={m.label}>
            <Smear y={(1 - p) * 10} style={{ position: "absolute", left: x, top: Y, width: CW, opacity: p, transform: `translateY(${(1 - p) * 50}px)` }}>
              <div style={{ height: 150, borderRadius: 18, background: C.card, border: `1px solid ${lit ? C.ink : C.line}`, boxShadow: SHADOW, padding: "16px 18px", boxSizing: "border-box", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 12, letterSpacing: 1.5, color: C.faint }}>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: CW - 70 }}>{m.label}</span>
                  <span>0{i + 1}</span>
                </div>
                <Roll from={0} to={m.value} start={18 + i * 6} end={52 + i * 6} style={{ fontFamily: SANS, fontWeight: 800, fontSize: 62, letterSpacing: -2, color: C.ink, display: "inline-block", marginTop: 4 }} />
                <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 16, color: C.muted, whiteSpace: "nowrap" }}>{m.hint}</div>
                <div style={{ position: "absolute", left: 0, top: 18, width: 4, height: 40, borderRadius: 2, background: C.accent, opacity: lit ? 1 : 0 }} />
              </div>
            </Smear>
            {i < n - 1 ? <div style={{ position: "absolute", left: x + CW + GAP / 2 - 5, top: Y + 70, width: 10, height: 10, borderRadius: 5, background: C.line, opacity: p }} /> : null}
          </React.Fragment>
        );
      })}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        {ms.map((_, i) => {
          const sx = X0 + i * (CW + GAP) + CW / 2;
          return <path key={i} d={`M ${sx} ${Y + 150} C ${sx} ${Y + 230}, ${W / 2} ${Y + 200}, ${W / 2} ${Y + 290}`} stroke={C.ink} strokeOpacity={0.35} strokeWidth={1.5} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lines} />;
        })}
      </svg>
      <div style={{ position: "absolute", top: Y + 290, width: W, display: "flex", justifyContent: "center", opacity: pill, transform: `translateY(${(1 - pill) * 30}px) scale(${0.92 + 0.08 * pill})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "16px 34px", borderRadius: 999, background: C.ink, boxShadow: SHADOW }}>
          <span style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: onInk(0.55), maxWidth: 140, lineHeight: 1.3 }}>{s.total.label}</span>
          <Roll from={0} to={s.total.value} start={88} end={116} style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: -2, color: C.accent, display: "inline-block" }} />
          {s.total.suffix ? <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, color: onInk(0.5) }}>{s.total.suffix}</span> : null}
        </div>
      </div>
      {s.footnote ? <div style={{ position: "absolute", top: Y + 410, width: W, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 34, color: C.muted, opacity: tw(frame, [104, 116], [0, 1]) }}>{s.footnote}</div> : null}
    </AbsoluteFill>
  );
}

function ShowcaseScene({ s }: { s: Extract<Scene, { type: "showcase" }> }) {
  const frame = useCurrentFrame();
  const a = tw(frame, [0, 20], [0, 1]);
  const b = tw(frame, [8, 28], [0, 1]);
  const m = tw(frame, [130, 146], [0, 1], INOUT);
  const card = tw(frame, [6, 36], [0, 1]);
  const chars = Math.floor(tw(frame, [22, 92], [0, s.card.text.length], Easing.linear));
  const img = tw(frame, [92, 112], [0, 1], INOUT);
  const CLICK = 126;
  const done = frame >= CLICK;
  const stamp = spring({ frame: frame - CLICK - 2, fps: FPS, config: { damping: 13, stiffness: 160 } });
  const exit = tw(frame, [138, 150], [0, 1], EIN);
  return (
    <Smear x={exit * 50} style={{ position: "absolute", inset: 0, transform: `translateX(${-exit * 800}px)`, opacity: 1 - exit }}>
      <div style={{ position: "absolute", left: 140, top: 340, overflow: "hidden", paddingBottom: 20 }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 110, letterSpacing: -4, color: C.ink, transform: `translateY(${(1 - a) * 140}px)`, whiteSpace: "nowrap" }}>{s.line1}</div>
      </div>
      <div style={{ position: "absolute", left: 140, top: 470, overflow: "hidden", paddingBottom: 24 }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 128, color: C.inkSoft, transform: `translateY(${(1 - b) * 160}px)`, whiteSpace: "nowrap" }}>{withMark(s.line2, s.mark, m)}</div>
      </div>
      {s.body ? <div style={{ position: "absolute", left: 140, top: 660, width: 620, fontFamily: SANS, fontWeight: 600, fontSize: 25, lineHeight: 1.5, color: C.muted, opacity: tw(frame, [30, 44], [0, 1]) }}>{s.body}</div> : null}
      <div style={{ position: "absolute", left: 1000, top: 150, width: 760, perspective: 2000 }}>
        <div style={{ transform: `rotateY(${interpolate(card, [0, 1], [-28, -8])}deg) rotateX(${interpolate(card, [0, 1], [10, 3])}deg) translateY(${(1 - card) * 80}px)`, opacity: card, transformOrigin: "left center", position: "relative" }}>
          <div style={{ borderRadius: 26, background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW, padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 25, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 18, color: C.accent }}>{s.card.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 23, color: C.ink }}>{s.card.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 1.5, color: C.faint }}>{chars < s.card.text.length ? "MENULIS…" : (s.card.status ?? "PREVIEW")}</div>
              </div>
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 25, lineHeight: 1.5, color: C.ink, whiteSpace: "pre-wrap", marginTop: 18, minHeight: 225 }}>
              {s.card.text.slice(0, chars)}
              {chars < s.card.text.length ? <span style={{ display: "inline-block", width: 3, height: 28, background: C.ink, marginLeft: 2, verticalAlign: "middle" }} /> : null}
            </div>
            {s.card.imageText ? (
              <div style={{ height: 200, borderRadius: 18, overflow: "hidden", position: "relative", background: `linear-gradient(135deg, ${C.secondary}, ${C.accent})`, clipPath: `inset(0 ${(1 - img) * 100}% 0 0 round 18px)` }}>
                <div style={{ position: "absolute", left: 50, top: 30, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, ${rgba("#ffffff", 0.9)}, ${rgba("#ffffff", 0.15)} 70%)` }} />
                <div style={{ position: "absolute", right: 40, top: 46, fontFamily: SERIF, fontStyle: "italic", fontSize: 58, color: C.secondaryInk, lineHeight: 1.02, textAlign: "right", maxWidth: 440 }}>{s.card.imageText}</div>
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 28, marginTop: 18 }}>
              {[Icons.Heart, Icons.MessageCircle, Icons.Repeat2, Icons.Send].map((I, k) => (
                <I key={k} size={25} color={C.muted} strokeWidth={2} />
              ))}
            </div>
          </div>
          {done ? (
            <div style={{ position: "absolute", right: -26, top: -24, transform: `rotate(6deg) scale(${stamp})` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 22px", borderRadius: 999, background: C.accent, border: `2px solid ${C.ink}`, fontFamily: MONO, fontWeight: 700, fontSize: 17, letterSpacing: 2, color: C.accentInk }}>
                <Icons.Pin size={18} color={C.accentInk} strokeWidth={2.6} /> {s.action.badge}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ position: "absolute", left: 1010, top: 900, display: "flex", alignItems: "center", gap: 10, padding: "15px 26px", borderRadius: 999, background: done ? C.accent : C.ink, color: done ? C.accentInk : C.paper, fontFamily: SANS, fontWeight: 800, fontSize: 21, opacity: tw(frame, [40, 54], [0, 1]) }}>
        {done ? <Icons.Check size={20} color={C.accentInk} strokeWidth={3} /> : <Icons.Pin size={20} color={C.accent} strokeWidth={2.4} />}
        {done ? s.action.done : s.action.label}
      </div>
      <Cursor points={[{ f: 96, x: 1860, y: 1040 }, { f: 120, x: 1140, y: 930 }, { f: 150, x: 1150, y: 935 }]} clicks={[CLICK]} />
    </Smear>
  );
}

function StatsScene({ s }: { s: Extract<Scene, { type: "stats" }> }) {
  const frame = useCurrentFrame();
  const items = s.items.slice(0, 3);
  const per = 40;
  const beat = Math.min(items.length - 1, Math.floor(frame / per));
  const local = frame - beat * per;
  const enter = tw(local, [0, 14], [0, 1]);
  const total = items.length * per;
  const wipe = tw(frame, [total - 20, total], [0, 1], INOUT);
  const it = items[beat];
  const darkBeat = beat === 1;
  const text = typeof it.value === "number" ? String(it.value) : it.value;
  const size = text.length > 5 ? Math.max(180, 300 - (text.length - 5) * 26) : 300;
  return (
    <AbsoluteFill>
      {darkBeat ? <div style={{ position: "absolute", left: 110, top: 110, right: 110, bottom: 110, borderRadius: 34, background: C.ink, transform: `scale(${0.92 + 0.08 * enter})`, opacity: enter }} /> : null}
      <div style={{ position: "absolute", left: 170, top: 160, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: darkBeat ? onInk(0.5) : C.faint }}>
        0{beat + 1} / 0{items.length}
      </div>
      <div style={{ position: "absolute", top: 260, width: W, display: "flex", justifyContent: "center", opacity: 0.07 }}>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 560, lineHeight: 1, letterSpacing: -20, color: "transparent", WebkitTextStroke: `3px ${darkBeat ? C.paper : C.ink}`, transform: `translateX(${local * 2}px)`, whiteSpace: "nowrap" }}>{text}</span>
      </div>
      <Smear x={(1 - enter) * 30} style={{ position: "absolute", top: 540 - size * 0.7, width: W, display: "flex", justifyContent: "center", transform: `translateX(${(1 - enter) * 200}px)`, opacity: enter }}>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: -size * 0.04, lineHeight: 1, color: darkBeat ? C.accent : C.ink, whiteSpace: "nowrap" }}>
          {typeof it.value === "number" ? <Roll from={0} to={it.value} start={beat * per} end={beat * per + 18} /> : it.value}
        </span>
      </Smear>
      <div style={{ position: "absolute", top: 680, width: W, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: darkBeat ? onInk(0.7) : C.muted, opacity: tw(local, [8, 18], [0, 1]) }}>{it.label}</div>
      {wipe > 0 ? <div style={{ position: "absolute", left: interpolate(wipe, [0, 1], [W / 2 - 160, 0]), top: interpolate(wipe, [0, 1], [H / 2 - 100, 0]), width: interpolate(wipe, [0, 1], [320, W]), height: interpolate(wipe, [0, 1], [200, H]), borderRadius: interpolate(wipe, [0, 1], [28, 0]), background: KIN[0].bg }} /> : null}
    </AbsoluteFill>
  );
}

const KIN = [
  { bg: C.accent, fg: C.accentInk, dot: C.accentInk },
  { bg: C.secondary, fg: C.secondaryInk, dot: C.accent },
  { bg: C.paper, fg: C.secondary, dot: C.ink },
  { bg: C.ink, fg: C.paper, dot: C.accent },
];

function KineticScene({ s }: { s: Extract<Scene, { type: "kinetic" }> }) {
  const frame = useCurrentFrame();
  const i = Math.min(s.words.length - 1, Math.floor(frame / 28));
  const k = KIN[i % KIN.length];
  const local = frame - i * 28;
  const enter = tw(local, [0, 10], [0, 1]);
  const raw = s.words[i].text;
  const word = raw.replace(/\.$/, "");
  const size = word.length > 8 ? Math.max(130, 250 - (word.length - 8) * 18) : 250;
  return (
    <AbsoluteFill style={{ background: k.bg }}>
      <div style={{ position: "absolute", top: 190, left: 150, right: 150, height: 1.5, background: k.fg, opacity: 0.35, transform: `scaleX(${tw(local, [0, 16], [0, 1])})`, transformOrigin: "left" }} />
      <Smear x={(1 - enter) * 46} style={{ position: "absolute", top: 0, width: W, height: H, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateX(${(1 - enter) * 340}px) scaleX(${1 + (1 - enter) * 0.25})` }}>
        <span style={{ fontFamily: BLACK, fontSize: size, letterSpacing: -4, color: k.fg, lineHeight: 1, whiteSpace: "nowrap" }}>
          {word}
          <span style={{ color: k.dot }}>.</span>
        </span>
      </Smear>
      {s.words[i].sub ? <div style={{ position: "absolute", bottom: 190, width: W, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 40, color: k.fg, opacity: tw(local, [8, 18], [0, 0.8]) }}>{s.words[i].sub}</div> : null}
    </AbsoluteFill>
  );
}

function Sparkle({ x, y, sz, at }: { x: number; y: number; sz: number; at: number }) {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - at, fps: FPS, config: { damping: 12, stiffness: 160 } });
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" style={{ position: "absolute", left: x - sz / 2, top: y - sz / 2, transform: `scale(${p}) rotate(${frame * 1.2}deg)` }}>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill={C.ink} />
    </svg>
  );
}

function LogoScene({ s, dur }: { s: Extract<Scene, { type: "logo" }>; dur: number }) {
  const frame = useCurrentFrame();
  const converge = tw(frame, [0, 30], [0, 1], INOUT);
  const logo = spring({ frame: frame - 28, fps: FPS, config: { damping: 13, stiffness: 140 } });
  const CY = 360;
  const t1 = tw(frame, [50, 72], [0, 1]);
  const t2 = tw(frame, [56, 78], [0, 1]);
  const m = tw(frame, [92, 108], [0, 1], INOUT);
  const cta = tw(frame, [100, 116], [0, 1]);
  const fadeOut = tw(frame, [dur - 16, dur], [0, 1], Easing.linear);
  return (
    <AbsoluteFill>
      {frame < 32
        ? Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2 + frame * 0.08;
            const r = 200 * (1 - converge);
            return <div key={i} style={{ position: "absolute", left: W / 2 + Math.cos(a) * r - 10, top: CY + Math.sin(a) * r - 10, width: 20, height: 20, borderRadius: 10, background: C.ink, opacity: 1 - converge * 0.6 }} />;
          })
        : null}
      <div style={{ position: "absolute", left: W / 2 - 12, top: CY - 12, width: 24, height: 24, borderRadius: 12, background: C.accent, transform: `scale(${converge * (1 - Math.min(1, logo))})` }} />
      <div style={{ position: "absolute", left: W / 2 - 200, top: CY - 200, width: 400, height: 400, borderRadius: 200, border: `1.5px solid ${rgba(C.ink, 0.18)}`, transform: `scale(${logo})` }} />
      <div style={{ position: "absolute", left: W / 2 - 170, top: CY - 50, width: 340, height: 100, borderRadius: "50%", border: `2px solid ${C.ink}`, transform: `rotate(${-16 + frame * 0.4}deg) scale(${logo})` }} />
      <div style={{ position: "absolute", left: W / 2 - 80, top: CY - 80, width: 160, height: 160, transform: `scale(${logo})` }}>
        {config.brand.logo ? (
          <Img src={staticFile(config.brand.logo)} style={{ width: 160, height: 160, borderRadius: 40, boxShadow: SHADOW, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 160, height: 160, borderRadius: 40, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.accent }}>{config.brand.initials ?? s.name.slice(0, 2)}</div>
        )}
      </div>
      {frame >= 34 ? (
        <>
          <Sparkle x={W / 2 + 150} y={CY - 110} sz={34} at={36} />
          <Sparkle x={W / 2 - 170} y={CY - 70} sz={22} at={40} />
          <Sparkle x={W / 2 + 120} y={CY + 120} sz={18} at={44} />
        </>
      ) : null}
      <div style={{ position: "absolute", top: 540, width: W, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 26, overflow: "hidden", paddingBottom: 20 }}>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 120, letterSpacing: -5, color: C.ink, transform: `translateY(${(1 - t1) * 160}px)`, display: "inline-block" }}>{s.name}</span>
        {s.accentWord ? <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 132, color: C.secondary, transform: `translateY(${(1 - t2) * 170}px)`, display: "inline-block" }}>{s.accentWord}</span> : null}
      </div>
      <div style={{ position: "absolute", top: 730, width: W, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: C.muted, opacity: tw(frame, [76, 90], [0, 1]) }}>{withMark(s.tagline, s.mark, m)}</div>
      {s.cta ? (
        <div style={{ position: "absolute", top: 830, width: W, display: "flex", justifyContent: "center", opacity: cta, transform: `translateY(${(1 - cta) * 20}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 26px", borderRadius: 999, background: C.ink, fontFamily: SANS, fontWeight: 700, fontSize: 21, color: C.accent }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: C.accent }} /> {s.cta}
          </div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: C.paper, opacity: fadeOut }} />
    </AbsoluteFill>
  );
}

function renderScene(s: Scene, dur: number) {
  switch (s.type) {
    case "spark":
      return <SparkScene s={s} />;
    case "word":
      return <WordScene s={s} />;
    case "tagline":
      return <TaglineScene s={s} dur={dur} />;
    case "bento":
      return <BentoScene s={s} />;
    case "checklist":
      return <ChecklistScene s={s} />;
    case "steps":
      return <StepsScene s={s} />;
    case "formula":
      return <FormulaScene s={s} />;
    case "showcase":
      return <ShowcaseScene s={s} />;
    case "stats":
      return <StatsScene s={s} />;
    case "kinetic":
      return <KineticScene s={s} />;
    case "logo":
      return <LogoScene s={s} dur={dur} />;
  }
}

/* ================================================================== sound effects */

type Cue = { f: number; src: string; vol: number };
const SFX_LEN: Record<string, number> = { whoosh: 42, smear: 17, sweep: 54, click: 5, pop: 6, "pop-low": 7, drop: 9, tick: 4, chime: 44, outro: 92, ping: 38, dud: 9, typing: 82, shimmer: 92 };

function buildCues(): Cue[] {
  const c: Cue[] = [];
  SCENES.forEach((s, i) => {
    const at = (f: number, src: string, vol: number) => c.push({ f: FROM[i] + f, src, vol });
    switch (s.type) {
      case "spark":
        at(30, "drop", 0.4);
        at(40, "shimmer", 0.35);
        at(44, "ping", 0.25);
        at(94, "smear", 0.35);
        break;
      case "word":
        at(0, "smear", 0.45);
        s.cards.slice(0, 6).forEach((_, k) => at(10 + k * 5, "pop", 0.14));
        if (s.counter) for (let f = 22; f < 92; f += 7) at(f, "tick", 0.08);
        at(104, "smear", 0.45);
        break;
      case "tagline":
        at(0, "smear", 0.3);
        if (s.mark) at(30, "tick", 0.2);
        if (s.dip !== false) at(DURS[i] - 18, "whoosh", 0.3);
        break;
      case "bento":
        at(2, "whoosh", 0.32);
        for (let k = 0; k < 6; k++) at(12 + k * 6, "pop", 0.13);
        at(122, "smear", 0.4);
        break;
      case "checklist": {
        at(8, "pop-low", 0.2);
        at(28, "sweep", 0.28);
        const items = s.items.slice(0, 6);
        const cols = Math.min(3, items.length);
        const gridW = cols * 440 + (cols - 1) * 20;
        const GX = (W - gridW) / 2;
        items.forEach((it, k) => {
          const cx = GX + (k % cols) * 460 + 220;
          at(Math.round(30 + ((cx - (GX - 40)) / (gridW + 80)) * 56) + Math.floor(k / cols), it.ok ? "pop" : "dud", it.ok ? 0.18 : 0.22);
        });
        at(88, "chime", 0.25);
        at(114, "whoosh", 0.3);
        break;
      }
      case "steps": {
        const n = Math.max(2, Math.min(6, s.steps.length));
        for (let k = 0; k < n; k++) at(Math.round(22 + (74 * k) / (n - 1)), "tick", 0.22);
        (s.results ?? []).slice(0, 3).forEach((_, k) => at(100 + k * 6, "pop", 0.16));
        at(114, "smear", 0.4);
        break;
      }
      case "formula":
        s.metrics.slice(0, 6).forEach((_, k) => at(12 + k * 6, "pop", 0.13));
        at(58, "whoosh", 0.18);
        for (let f = 90; f < 116; f += 4) at(f, "tick", 0.08);
        at(116, "chime", 0.28);
        at(122, "whoosh", 0.3);
        break;
      case "showcase":
        at(0, "smear", 0.3);
        at(22, "typing", 0.22);
        at(126, "click", 0.45);
        at(130, "chime", 0.26);
        at(136, "smear", 0.4);
        break;
      case "stats":
        s.items.slice(0, 3).forEach((_, k) => at(k * 40, "smear", 0.4));
        at(s.items.slice(0, 3).length * 40 - 22, "whoosh", 0.32);
        break;
      case "kinetic":
        s.words.forEach((_, k) => at(k * 28, "smear", 0.45));
        break;
      case "logo":
        at(0, "shimmer", 0.3);
        at(28, "pop-low", 0.3);
        at(50, "outro", 0.38);
        break;
    }
  });
  return c;
}
const CUES = config.sfx === false ? [] : buildCues();

/* ================================================================== composition */

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const undips = SCENES.map((s, i) => (i > 0 && SCENES[i - 1].type === "tagline" && (SCENES[i - 1] as Extract<Scene, { type: "tagline" }>).dip !== false ? FROM[i] : -1)).filter((f) => f >= 0);
  const u = undips.find((f) => frame >= f && frame < f + 12);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Paper />
      {SCENES.map((s, i) => (
        <Sequence key={i} from={FROM[i]} durationInFrames={DURS[i]} premountFor={FPS}>
          {renderScene(s, DURS[i])}
        </Sequence>
      ))}
      {u !== undefined ? <AbsoluteFill style={{ background: C.ink, opacity: tw(frame, [u, u + 12], [1, 0], INOUT) }} /> : null}
      <Hud />
      {CUES.map((cue, i) => (
        <Sequence key={i} from={cue.f} durationInFrames={SFX_LEN[cue.src]} layout="none">
          <Html5Audio src={staticFile(`sfx/${cue.src}.wav`)} volume={cue.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
