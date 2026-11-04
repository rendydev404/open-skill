import React from "react";
import { AbsoluteFill, Img, interpolate, interpolateColors, spring, staticFile, useVideoConfig } from "remotion";
import { BlurFilter, Cursor, GradText, StepTag, typed, useFilterId, useFrame, Words } from "./primitives";
import { BRAND, C, clamp, DISPLAY, easeInOut, easeOut, GRADIENT, GRADIENT_DARK, SANS } from "./theme";

/**
 * Scene generik. Waktu di dalam scene memakai useFrame() (sudah dikali `speed` dari Promo.tsx),
 * jadi semua angka frame di sini adalah "waktu desain", bukan frame nyata.
 * `dur` = panjang scene dalam waktu desain; `beats` = waktu desain kata-kata ketukan (lihat DEFS.beats).
 *
 * Scene khusus produk (UI login, form, dashboard, kartu hasil...) DITULIS PER PRODUK.
 * Lihat references/example-scenes-threads-automation.tsx.txt untuk 13 contoh yang sudah teruji.
 */
export type SceneProps = { dur: number; beats: number[] };

const LOGO = staticFile(BRAND.logo);
export const center: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center" };

export const glass: React.CSSProperties = {
  borderRadius: 40,
  background: "linear-gradient(180deg, rgba(40,45,68,0.94), rgba(22,25,40,0.94))",
  border: "1.5px solid rgba(255,255,255,0.10)",
  boxShadow: "0 40px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
};

export const white: React.CSSProperties = {
  borderRadius: 40,
  background: "#ffffff",
  boxShadow: "0 40px 110px rgba(10,12,30,0.35)",
  color: C.ink,
  fontFamily: SANS,
};

/** Muncul halus: blur -> tajam, naik sedikit. */
export const useRise = (start: number, dur = 20) => {
  const frame = useFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - start, fps, config: { damping: 200 }, durationInFrames: dur });
};
export const rise = (p: number, dy = 40): React.CSSProperties => ({
  opacity: p,
  filter: `blur(${(1 - p) * 14}px)`,
  transform: `translateY(${(1 - p) * dy}px)`,
});

export const Check: React.FC<{ size?: number; color?: string; bg?: string; s?: number }> = ({ size = 44, color = C.accent, bg = C.accentSoft, s = 1 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: bg, ...center, transform: `scale(${s})`, flexShrink: 0 }}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
      <path d="M5 12.5l4.2 4L19 7" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/* ================================================================== */
/* HOOK 3 ketukan (curiosity gap): hasil mengejutkan -> twist -> "Kok bisa?" */
/* beats[0] = awal ketukan 2, beats[1] = awal ketukan 3.               */
/* ================================================================== */
export const HOOK_COPY = {
  a1: "Akun ini",
  a2: "jualan tiap hari.", // hasil yang bikin penasaran (gradien)
  chips: ["Order masuk 07.00", "Order masuk 12.00", "Order masuk 19.00"], // bukti kecil yang muncul
  b1: "padahal yang punya",
  b2: "lagi liburan.", // twist (gradien)
  c1: "Kok",
  c2: "bisa?",
};

export const Hook: React.FC<SceneProps> = ({ beats }) => {
  const frame = useFrame();
  const { fps } = useVideoConfig();
  const id = useFilterId();
  const [P2, P3] = beats;
  const phase = frame < P2 ? 1 : frame < P3 ? 2 : 3;
  const start = phase === 1 ? 0 : phase === 2 ? P2 : P3;
  const end = phase === 1 ? P2 : phase === 2 ? P3 : 99999;
  const pin = interpolate(frame, [start, start + 8], [0, 1], { ...clamp, easing: easeOut });
  const pout = interpolate(frame, [end - 6, end], [0, 1], { ...clamp, easing: easeInOut });
  const slam = interpolate(frame, [P3, P3 + 6], [0, 1], { ...clamp, easing: easeOut });
  const shake = phase === 3 && frame > P3 + 5 && frame < P3 + 16 ? Math.sin(frame * 2.7) * (P3 + 16 - frame) * 1.8 : 0;
  // PENTING: blur hanya saat masuk/keluar ketukan — jangan biarkan nilai fase sebelumnya menempel.
  const bx = phase === 3 ? (1 - slam) * 40 : (1 - pin) * 60 + pout * 60;
  const tx = phase === 3 ? shake : (1 - pin) * 700 - pout * 700;
  return (
    <AbsoluteFill style={{ ...center }}>
      <BlurFilter id={id} x={bx} y={phase === 3 ? (1 - slam) * 30 : 0} />
      <div style={{ ...center, flexDirection: "column", filter: bx > 0.3 ? `url(#${id})` : undefined, transform: `translate(${tx}px, ${shake * 0.6}px)` }}>
        {phase === 1 ? (
          <>
            <Words size={104} start={2} stagger={3} segs={[{ t: HOOK_COPY.a1 }]} />
            <Words size={168} start={14} stagger={4} style={{ marginTop: 4 }} segs={[{ t: HOOK_COPY.a2, grad: GRADIENT }]} />
            <div style={{ display: "flex", gap: 20, marginTop: 44 }}>
              {HOOK_COPY.chips.map((t, i) => {
                const p = spring({ frame: frame - 40 - i * 12, fps, config: { damping: 12, stiffness: 170 } });
                return (
                  <div
                    key={t}
                    style={{
                      transform: `scale(${p}) translateY(${(1 - p) * 30}px)`,
                      opacity: Math.min(1, p * 1.5),
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 28px",
                      borderRadius: 999,
                      background: "#fff",
                      boxShadow: "0 16px 40px rgba(20,23,43,0.14)",
                      fontFamily: SANS,
                      fontWeight: 700,
                      fontSize: 32,
                      color: C.ink,
                    }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#0f9d6c", boxShadow: "0 0 12px #3dd6a0" }} />
                    {t}
                  </div>
                );
              })}
            </div>
          </>
        ) : phase === 2 ? (
          <>
            <Words size={104} start={P2 + 4} stagger={3} segs={[{ t: HOOK_COPY.b1 }]} />
            <Words size={176} start={P2 + 20} stagger={4} style={{ marginTop: 4 }} segs={[{ t: HOOK_COPY.b2, grad: GRADIENT }]} />
          </>
        ) : (
          <div
            style={{
              transform: `scale(${2.6 - 1.6 * slam})`,
              opacity: Math.min(1, slam * 1.5),
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 260,
              letterSpacing: "-0.05em",
              color: C.ink,
              whiteSpace: "nowrap",
            }}
          >
            {HOOK_COPY.c1} <GradText>{HOOK_COPY.c2}</GradText>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* Potong keras ke warna aksen, logo jatuh, halo titik, layar menggelap. */
/* Tandai opaque: true di DEFS (punya latar sendiri).                  */
/* ================================================================== */
export const BrandSolid: React.FC<SceneProps> = () => {
  const frame = useFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: frame - 26, fps, config: { damping: 14, stiffness: 120 } });
  const grow = interpolate(frame, [44, 70], [0, 1], { ...clamp, easing: easeInOut });
  const toDark = interpolate(frame, [58, 80], [0, 1], { ...clamp, easing: easeInOut });
  const textOut = interpolate(frame, [30, 44], [0, 1], clamp);
  const halo = spring({ frame: frame - 40, fps, config: { damping: 200 }, durationInFrames: 30 });
  const bg = interpolateColors(toDark, [0, 1], [C.accent, C.dark]);
  const logoSize = interpolate(grow, [0, 1], [190, 360]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${interpolateColors(toDark, [0, 1], [C.accentLight, C.dark])} 0%, ${bg} 70%)` }}>
      <AbsoluteFill style={{ ...center, opacity: 1 - textOut, filter: `blur(${textOut * 16}px)`, transform: `translateY(${-textOut * 60}px)` }}>
        <Words size={112} start={4} stagger={4} color="#ffffff" from="rgba(255,255,255,0.3)" segs={[{ t: "Kenalin..." }]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ ...center }}>
        <div
          style={{
            width: 1100,
            height: 1100,
            borderRadius: "50%",
            backgroundImage: `radial-gradient(circle, ${interpolateColors(toDark, [0, 1], ["#ffffff", C.accentLight])} 4px, transparent 5px)`,
            backgroundSize: "30px 30px",
            maskImage: "radial-gradient(circle, transparent 30%, black 34%, black 52%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 30%, black 34%, black 52%, transparent 70%)",
            transform: `scale(${0.3 + halo * 0.9}) rotate(${frame * 0.6}deg)`,
            opacity: halo * (1 - toDark * 0.85),
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ ...center }}>
        <div
          style={{
            width: logoSize,
            height: logoSize,
            transform: `translate(${(1 - drop) * -900}px, ${(1 - drop) * -700}px) rotate(${(1 - drop) * -140}deg)`,
            opacity: frame < 26 ? 0 : 1,
            borderRadius: "24%",
            boxShadow: `0 0 ${60 + grow * 80}px ${C.accentLight}`,
          }}
        >
          <Img src={LOGO} style={{ width: "100%", height: "100%" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* Logo bergeser ke kiri, nama produk tersingkap huruf demi huruf.     */
/* ================================================================== */
export const BrandReveal: React.FC<SceneProps> = () => {
  const frame = useFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 2, fps, config: { damping: 200 }, durationInFrames: 28 });
  const size = interpolate(p, [0, 1], [360, 200]);
  const x = interpolate(p, [0, 1], [960, 340]);
  const name = `${BRAND.first} ${BRAND.second}`;
  const tag = useRise(38);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: x - size / 2, top: 540 - size / 2 - 30, width: size, height: size, borderRadius: "24%", boxShadow: `0 0 90px ${C.accentLight}` }}>
        <Img src={LOGO} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ position: "absolute", left: 480, top: 510, transform: "translateY(-50%)", display: "flex" }}>
        {name.split("").map((ch, i) => {
          const f = frame - 12 - i * 1.6;
          const q = spring({ frame: f, fps, config: { damping: 200 }, durationInFrames: 16 });
          const grad = i > BRAND.first.length;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: name.length > 18 ? 130 : 150,
                letterSpacing: "-0.04em",
                opacity: interpolate(f, [0, 6], [0, 1], clamp),
                filter: `blur(${(1 - q) * 18}px)`,
                transform: `translateX(${(1 - q) * -40}px)`,
                color: grad ? "transparent" : "#fff",
                backgroundImage: grad ? GRADIENT_DARK : undefined,
                WebkitBackgroundClip: grad ? "text" : undefined,
                backgroundClip: grad ? "text" : undefined,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 488, top: 640, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: "#a0a6bd", ...rise(tag, 20) }}>{BRAND.tagline}</div>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* Langkah fitur generik: label langkah + judul + kartu daftar bukti.  */
/* Pakai untuk prototipe cepat; ganti dengan UI asli produk bila bisa. */
/* ================================================================== */
export const makeFeature = (cfg: { step: number; label: string; title: [string, string]; card: string; items: string[]; dark?: boolean }) => {
  const Feature: React.FC<SceneProps> = () => {
    const frame = useFrame();
    const { fps } = useVideoConfig();
    const card = useRise(10, 24);
    const dark = cfg.dark ?? true;
    return (
      <AbsoluteFill>
        <StepTag n={cfg.step} label={cfg.label} dark={dark} />
        <div style={{ position: "absolute", left: 150, top: 380, width: 800 }}>
          <Words
            justify="flex-start"
            size={96}
            start={2}
            stagger={3}
            color={dark ? "#fff" : C.ink}
            from={dark ? "rgba(255,255,255,0.3)" : C.faint}
            segs={[{ t: cfg.title[0] }, { t: cfg.title[1], grad: dark ? GRADIENT_DARK : GRADIENT }]}
          />
        </div>
        <div style={{ position: "absolute", left: 1060, top: 260, width: 700, padding: "40px 46px", ...white, ...rise(card, 60) }}>
          <div style={{ display: "inline-block", padding: "12px 30px", borderRadius: 999, background: GRADIENT, color: "#fff", fontFamily: DISPLAY, fontWeight: 800, fontSize: 34 }}>{cfg.card}</div>
          <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 16 }}>
            {cfg.items.map((t, i) => {
              const st = 24 + i * 14;
              const ok = spring({ frame: frame - st - t.length / 2.4, fps, config: { damping: 11, stiffness: 180 } });
              return (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 18, minHeight: 60 }}>
                  <Check s={ok} />
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 42, letterSpacing: "-0.02em" }}>{typed(t, frame, st, 2.4)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    );
  };
  return Feature;
};

/* ================================================================== */
/* Penutup: logo + nama, tagline, tombol CTA diklik tepat saat VO-nya. */
/* ================================================================== */
export const CTA_COPY = { line: [{ t: "Kerja beres" }, { t: "tanpa ribet,", grad: GRADIENT }, { t: "setiap hari." }], button: "Coba sekarang →" };

export const Cta: React.FC<SceneProps> = ({ dur }) => {
  const frame = useFrame();
  const { fps } = useVideoConfig();
  const click = dur - 50;
  const logo = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const btn = spring({ frame: frame - (click - 50), fps, config: { damping: 12, stiffness: 140 } });
  const name = useRise(4, 18);
  const mv = interpolate(frame, [click - 28, click - 4], [0, 1], { ...clamp, easing: easeInOut });
  const press = interpolate(frame, [click - 2, click + 2, click + 8], [0, 1, 0], clamp);
  const ring = interpolate(frame, [click + 2, click + 32], [0, 1], { ...clamp, easing: easeOut });
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.18);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ ...center, flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 40 }}>
          <Img src={LOGO} style={{ width: 120, height: 120, transform: `scale(${logo}) rotate(${(1 - logo) * -30}deg)` }} />
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 64, letterSpacing: "-0.035em", color: C.ink, ...rise(name, 0) }}>
            {BRAND.first} <GradText>{BRAND.second}</GradText>
          </div>
        </div>
        <Words size={118} start={10} stagger={3} style={{ maxWidth: 1600 }} segs={CTA_COPY.line} />
        <div
          style={{
            marginTop: 64,
            padding: "28px 64px",
            borderRadius: 999,
            background: GRADIENT,
            color: "#fff",
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 48,
            transform: `scale(${btn * (1 - press * 0.07)})`,
            boxShadow: `0 20px ${50 + pulse * 30}px ${C.accent}66`,
            position: "relative",
          }}
        >
          {CTA_COPY.button}
          <div style={{ position: "absolute", inset: -10, borderRadius: 999, border: `5px solid ${C.accent}`, transform: `scale(${1 + ring * 0.35})`, opacity: ring > 0 ? 1 - ring : 0 }} />
        </div>
      </AbsoluteFill>
      {frame >= click - 30 ? (
        <Cursor x={interpolate(mv, [0, 1], [1600, 1080])} y={interpolate(mv, [0, 1], [1040, 846])} press={press} opacity={interpolate(frame, [click - 30, click - 24], [0, 1], clamp)} />
      ) : null}
    </AbsoluteFill>
  );
};
