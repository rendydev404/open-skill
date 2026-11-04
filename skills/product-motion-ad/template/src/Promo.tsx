import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BlobBg, DarkBg, Scene, SpeedCtx, T, Tr } from "./primitives";
import { BrandReveal, BrandSolid, Cta, Hook, makeFeature, SceneProps } from "./scenes";
import { clamp, easeInOut, FPS } from "./theme";
import WORDS_JSON from "../public/vo/words.json";

type Sfx = "whoosh" | "whoosh-low" | "slam" | "logo-hit" | "click" | "pop" | "success" | "typing" | "riser" | "glitch";

type Def = {
  C: React.FC<SceneProps>;
  /** frasa pembuka kalimat VO yang memulai scene ini (dicocokkan ke words.json, urut) */
  cue?: string;
  /** frasa ketukan di dalam scene -> props.beats (waktu desain), mis. ketukan hook */
  beats?: string[];
  /** scene tanpa cue: mulai `after` frame nyata setelah cue scene sebelumnya */
  after?: number;
  /** percepatan animasi di dalam scene. Ritme referensi cepat: 1.5–3 untuk scene UI */
  speed: number;
  enter: Tr;
  exit: Tr;
  /** latar global gelap untuk scene ini (default terang) */
  dark?: boolean;
  /** scene punya latar sendiri yang menutup penuh (mis. BrandSolid) */
  opaque?: boolean;
  /** SFX dalam waktu desain scene: [waktu, id, volume] */
  sfx?: (dur: number, beats: number[]) => [number, Sfx, number][];
};

/* ------------------------------------------------------------------ */
/* ISI PER PRODUK: urutan scene = urutan flow pemakaian produk.         */
/* Satu kalimat VO = satu scene = satu keunggulan + bukti visualnya.    */
/* ------------------------------------------------------------------ */
const Step1 = makeFeature({ step: 1, label: "Langkah satu", title: ["Daftar", "sekali klik."], card: "Mulai", items: ["Login aman", "Tanpa kartu kredit"] });
const Step2 = makeFeature({ step: 2, label: "Langkah dua", title: ["Atur", "sesuai kebutuhan."], card: "Pengaturan", items: ["Pilih kategori", "Pilih gaya", "Simpan"], dark: false });

const DEFS: Def[] = [
  { C: Hook, cue: "contoh", beats: ["ganti", "scribe"], speed: 1, enter: "none", exit: "none", sfx: (_d, b) => [[40, "pop", 0.4], [52, "pop", 0.4], [64, "pop", 0.4], [b[0] - 6, "whoosh", 0.55], [b[1] - 6, "whoosh-low", 0.5], [b[1], "slam", 0.75]] },
  { C: BrandSolid, cue: "ganti", speed: 1.5, opaque: true, enter: "none", exit: "none", sfx: () => [[0, "glitch", 0.5], [24, "logo-hit", 0.6]] },
  { C: BrandReveal, after: 54, speed: 1.4, dark: true, enter: "none", exit: "blurZoom", sfx: () => [[10, "glitch", 0.3]] },
  { C: Step1, cue: "dengan", speed: 2, dark: true, enter: "push", exit: "push", sfx: () => [[24, "typing", 0.3], [40, "pop", 0.35]] },
  { C: Step2, cue: "hasil", speed: 2, enter: "push", exit: "blurZoom", sfx: () => [[24, "typing", 0.3], [60, "success", 0.45]] },
  { C: Cta, cue: "scribe", speed: 1.2, enter: "blurZoom", exit: "fade", sfx: (d) => [[2, "logo-hit", 0.5], [d - 50, "click", 0.7]] },
];

const PRE = 6; // scene mulai 6 frame sebelum suaranya
const END_HOLD = 40;

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const WORDS = (WORDS_JSON as { text: string; start: number; end: number }[]).map((w) => ({ ...w, n: norm(w.text) })).filter((w) => w.n);

const findCue = (phrase: string, from: number) => {
  const p = phrase.split(" ").map(norm);
  for (let i = from; i < WORDS.length; i++) {
    if (p.every((w, k) => WORDS[i + k]?.n.startsWith(w))) return i;
  }
  throw new Error(`Frasa VO "${phrase}" tidak ditemukan di words.json`);
};
const sec = (i: number) => Math.round(WORDS[i].start * FPS);

const build = () => {
  let wi = 0;
  const starts = DEFS.map((d) => {
    if (!d.cue) return -1;
    wi = findCue(d.cue, wi);
    return sec(wi);
  });
  const audioEnd = Math.ceil(WORDS[WORDS.length - 1].end * FPS);
  const froms: number[] = [];
  DEFS.forEach((d, i) => {
    if (i === 0) froms.push(0);
    else if (d.cue) froms.push(starts[i] - PRE);
    else froms.push(froms[i - 1] + (d.after ?? 60));
  });
  return {
    total: audioEnd + END_HOLD,
    scenes: DEFS.map((d, i) => {
      const from = froms[i];
      const next = DEFS[i + 1];
      const overlap = d.exit !== "none" || (next && next.enter !== "none") ? T : 0;
      const dur = next ? froms[i + 1] + overlap - from : audioEnd + END_HOLD - from;
      // ketukan: waktu desain relatif terhadap awal scene
      let bi = 0;
      const beats = (d.beats ?? []).map((b) => {
        bi = findCue(b, bi);
        return Math.round((sec(bi) - from) * d.speed) - 4;
      });
      return { ...d, from, dur, beats };
    }),
  };
};

export const TL = build();
export const PROMO_DURATION = TL.total;

const SFX = TL.scenes.flatMap((s, i) => {
  const list: { at: number; id: Sfx; vol: number }[] = [];
  if (i > 0 && s.enter !== "none") list.push({ at: Math.max(0, s.from - 3), id: i % 2 ? "whoosh" : "whoosh-low", vol: 0.5 });
  (s.sfx?.(s.dur * s.speed, s.beats) ?? []).forEach(([t, id, vol]) => list.push({ at: Math.round(s.from + t / s.speed), id, vol }));
  return list;
});

/** Keyframe gelap/terang latar global; pergantian di-crossfade di sekitar awal scene. */
const DARK_KEYS = (() => {
  const xs: number[] = [-1];
  const ys: number[] = [TL.scenes[0].dark ? 1 : 0];
  TL.scenes.forEach((s, i) => {
    if (i === 0) return;
    const prev = TL.scenes[i - 1];
    const a = prev.dark ? 1 : 0;
    const b = s.dark ? 1 : 0;
    if (a === b) return;
    const [x0, x1] = prev.opaque ? [s.from - 1, s.from] : [s.from - 8, s.from + T + 8];
    if (x0 <= xs[xs.length - 1]) return;
    xs.push(x0, x1);
    ys.push(a, b);
  });
  return { xs, ys };
})();

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const dark = DARK_KEYS.xs.length > 1 ? interpolate(frame, DARK_KEYS.xs, DARK_KEYS.ys, { ...clamp, easing: easeInOut }) : DARK_KEYS.ys[0];
  return (
    <AbsoluteFill>
      <BlobBg />
      {dark > 0 ? <DarkBg opacity={dark} glowY={1200} /> : null}
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    {TL.scenes.map((s, i) => (
      <Scene key={i} from={s.from} dur={s.dur} enter={s.enter} exit={s.exit}>
        <SpeedCtx.Provider value={s.speed}>
          <s.C dur={s.dur * s.speed} beats={s.beats} />
        </SpeedCtx.Provider>
      </Scene>
    ))}
    {SFX.map((c, i) => (
      <Sequence key={`sfx${i}`} from={c.at} layout="none">
        <Audio src={staticFile(`sfx/${c.id}.mp3`)} volume={c.vol} />
      </Sequence>
    ))}
    <Audio src={staticFile("vo/full.mp3")} />
  </AbsoluteFill>
);
