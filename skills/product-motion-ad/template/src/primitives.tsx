import React, { createContext, useContext, useId } from "react";
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, clamp, DISPLAY, easeInOut, GRADIENT, W } from "./theme";

/* ------------------------------------------------------------------ */
/* Blur arah (motion blur) lewat filter SVG: CSS blur() hanya isotropik. */
/* ------------------------------------------------------------------ */

/** Kecepatan waktu di dalam scene (1 = normal). Transisi scene tidak ikut dipercepat. */
export const SpeedCtx = createContext(1);
export const useFrame = () => useCurrentFrame() * useContext(SpeedCtx);

export const useFilterId = () => "f" + useId().replace(/[^a-zA-Z0-9]/g, "");

export const BlurFilter: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={`${Math.max(0, x)} ${Math.max(0, y)}`} />
      </filter>
    </defs>
  </svg>
);

/* ------------------------------------------------------------------ */
/* Scene: Sequence + transisi masuk/keluar seperti video referensi.    */
/* ------------------------------------------------------------------ */

export type Tr = "none" | "fade" | "blurZoom" | "push" | "whip";
export const T = 10;

/**
 * Transisi hanya menggerakkan KONTEN scene; latar (blob / grid gelap) adalah lapisan global
 * yang terus bergerak, jadi pergantian scene terasa satu tarikan kamera seperti referensi.
 */
const SceneInner: React.FC<{
  dur: number;
  enter: Tr;
  exit: Tr;
  children: React.ReactNode;
}> = ({ dur, enter, exit, children }) => {
  const frame = useCurrentFrame();
  const id = useFilterId();
  const pin = enter === "none" ? 1 : interpolate(frame, [0, T], [0, 1], { ...clamp, easing: easeInOut });
  const pout = exit === "none" ? 0 : interpolate(frame, [dur - T, dur], [0, 1], { ...clamp, easing: easeInOut });

  let scale = 1;
  let tx = 0;
  let bx = 0;
  let by = 0;
  let opacity = 1;

  const a = 1 - pin;
  if (enter === "fade") opacity *= pin;
  if (enter === "blurZoom") {
    scale *= 0.92 + 0.08 * pin;
    bx += 18 * a;
    by += 18 * a;
    opacity *= pin;
  }
  if (enter === "push") {
    tx += a * 480;
    bx += 70 * a;
    opacity *= pin;
  }
  if (enter === "whip") {
    tx += a * W * 0.5;
    bx += 70 * a;
    opacity *= Math.min(1, pin * 1.8);
  }

  if (exit === "fade") opacity *= 1 - pout;
  if (exit === "blurZoom") {
    scale *= 1 + 0.1 * pout;
    bx += 18 * pout;
    by += 18 * pout;
    opacity *= 1 - pout;
  }
  if (exit === "push") {
    tx += -pout * 480;
    bx += 70 * pout;
    opacity *= 1 - pout;
  }
  if (exit === "whip") {
    tx += -pout * W * 0.5;
    bx += 70 * pout;
    opacity *= 1 - pout * pout;
  }

  const blurred = bx + by > 0.2;
  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateX(${tx}px) scale(${scale})`,
        filter: blurred ? `url(#${id})` : undefined,
      }}
    >
      {blurred ? <BlurFilter id={id} x={bx} y={by} /> : null}
      {children}
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{
  from: number;
  dur: number;
  enter?: Tr;
  exit?: Tr;
  children: React.ReactNode;
}> = ({ from, dur, enter = "none", exit = "none", children }) => (
  <Sequence from={from} durationInFrames={dur}>
    <SceneInner dur={dur} enter={enter} exit={exit}>
      {children}
    </SceneInner>
  </Sequence>
);

/** Label langkah flow di pojok kiri atas: nomor + nama langkah. */
export const StepTag: React.FC<{ n: number; label: string; dark?: boolean }> = ({ n, label, dark = true }) => {
  const frame = useFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 4, fps, config: { damping: 200 }, durationInFrames: 22 });
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        top: 86,
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: p,
        filter: `blur(${(1 - p) * 10}px)`,
        transform: `translateX(${(1 - p) * -30}px)`,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: GRADIENT,
          color: "#fff",
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 28px ${C.accent}`,
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: dark ? "#c9cde0" : C.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Kata demi kata: muncul dari blur, abu-abu -> warna akhir.            */
/* ------------------------------------------------------------------ */

export type Seg = { t: string; c?: string; grad?: string };

export const Words: React.FC<{
  segs: Seg[];
  start?: number;
  stagger?: number;
  size: number;
  weight?: number;
  color?: string;
  from?: string;
  font?: string;
  style?: React.CSSProperties;
  justify?: React.CSSProperties["justifyContent"];
}> = ({ segs, start = 0, stagger = 4, size, weight = 800, color = C.ink, from = C.faint, font = DISPLAY, style, justify = "center" }) => {
  const frame = useFrame();
  const { fps } = useVideoConfig();
  const words: { w: string; c: string; grad?: string }[] = [];
  segs.forEach((s) =>
    s.t
      .split(" ")
      .filter(Boolean)
      .forEach((w) => words.push({ w, c: s.c ?? color, grad: s.grad })),
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: justify,
        columnGap: size * 0.26,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: "-0.035em",
        ...style,
      }}
    >
      {words.map((w, i) => {
        const f = frame - start - i * stagger;
        const p = spring({ frame: f, fps, config: { damping: 200 }, durationInFrames: 20 });
        const col = interpolateColors(f, [4, 18], [from, w.c]);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: interpolate(f, [0, 7], [0, 1], clamp),
              filter: `blur(${(1 - p) * 14}px)`,
              transform: `translateY(${(1 - p) * size * 0.32}px) scale(${1.08 - 0.08 * p})`,
              color: w.grad ? "transparent" : col,
              backgroundImage: w.grad,
              WebkitBackgroundClip: w.grad ? "text" : undefined,
              backgroundClip: w.grad ? "text" : undefined,
              paddingBottom: "0.08em",
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Latar terang dengan blob warna buram yang terus berubah bentuk.     */
/* ------------------------------------------------------------------ */

type Blob = { x: number; y: number; r: number; color: string; sp: number; ph: number };

const BLOBS: Blob[] = [
  { x: 1500, y: 180, r: 520, color: C.accent, sp: 0.022, ph: 0 },
  { x: 260, y: 820, r: 460, color: C.cyan, sp: 0.018, ph: 2 },
  { x: 1180, y: 1020, r: 360, color: C.violet, sp: 0.026, ph: 4 },
];

export const BlobBg: React.FC<{ intensity?: number; shift?: number; blobs?: Blob[] }> = ({ intensity = 1, shift = 0, blobs = BLOBS }) => {
  const frame = useCurrentFrame() + shift;
  return (
    <AbsoluteFill style={{ background: C.canvas, overflow: "hidden" }}>
      {blobs.map((b, i) => {
        const t = frame * b.sp + b.ph;
        const x = b.x + Math.sin(t) * 140;
        const y = b.y + Math.cos(t * 0.8) * 110;
        const r = b.r * (1 + Math.sin(t * 1.3) * 0.08);
        const br = [0, 1, 2, 3].map((k) => 42 + Math.sin(t * 1.7 + k * 1.6) * 16);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2 * 0.86,
              background: b.color,
              opacity: 0.78 * intensity,
              borderRadius: `${br[0]}% ${100 - br[0]}% ${br[1]}% ${100 - br[1]}% / ${br[2]}% ${br[3]}% ${100 - br[3]}% ${100 - br[2]}%`,
              transform: `rotate(${t * 22}deg)`,
              filter: "blur(70px)",
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Latar gelap: grid titik + cahaya aksen dari bawah.                  */
/* ------------------------------------------------------------------ */

export const DarkBg: React.FC<{ glow?: number; glowY?: number; opacity?: number }> = ({ glow = 1, glowY = 1150, opacity = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.dark, overflow: "hidden", opacity }}>
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(circle, rgba(123,138,255,0.22) 1.6px, transparent 2.2px)",
          backgroundSize: "34px 34px",
          backgroundPosition: `${frame * 0.4}px 0px`,
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 55%, black 20%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 55%, black 20%, transparent 85%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 960 - 1100 + Math.sin(frame * 0.03) * 120,
          top: glowY - 420,
          width: 2200,
          height: 840,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${C.accent} 0%, rgba(58,76,240,0.35) 40%, transparent 70%)`,
          opacity: 0.85 * glow,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1350 + Math.cos(frame * 0.025) * 90,
          top: glowY - 300,
          width: 900,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${C.cyan} 0%, transparent 65%)`,
          opacity: 0.45 * glow,
          filter: "blur(50px)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Kursor tangan / panah ala referensi.                                 */
/* ------------------------------------------------------------------ */

export const Cursor: React.FC<{ x: number; y: number; press?: number; label?: string; opacity?: number }> = ({
  x,
  y,
  press = 0,
  label = "kamu",
  opacity = 1,
}) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${1 - press * 0.18})`, transformOrigin: "0 0" }}>
    <svg width="54" height="54" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 6px 14px rgba(58,76,240,0.55))" }}>
      <path d="M4 2.5 L20 11 L12.6 12.9 L9.2 20.5 Z" fill={C.accentLight} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
    <div
      style={{
        position: "absolute",
        left: 38,
        top: 44,
        padding: "6px 16px",
        borderRadius: 999,
        background: C.accent,
        color: "#fff",
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: 22,
        whiteSpace: "nowrap",
        boxShadow: "0 0 0 2px rgba(255,255,255,0.15)",
      }}
    >
      {label}
    </div>
  </div>
);

/** Teks yang diketik huruf per huruf, dengan caret berkedip. */
export const typed = (text: string, frame: number, start: number, cps = 1.6) =>
  text.slice(0, Math.max(0, Math.floor((frame - start) * cps)));

export const Caret: React.FC<{ color?: string; h?: number }> = ({ color = C.accentLight, h = 1 }) => {
  const frame = useFrame();
  return (
    <span
      style={{
        display: "inline-block",
        width: "0.09em",
        height: `${h}em`,
        marginLeft: "0.06em",
        verticalAlign: "-0.12em",
        background: color,
        borderRadius: 3,
        opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0.15,
        boxShadow: `0 0 14px ${color}`,
      }}
    />
  );
};

export const GradText: React.FC<{ children: React.ReactNode; grad?: string }> = ({ children, grad = GRADIENT }) => (
  <span style={{ backgroundImage: grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{children}</span>
);
