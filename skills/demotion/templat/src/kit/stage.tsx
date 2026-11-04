import { type ReactNode, useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { BRAND, CH, CHROME_H, CW, FPS, PAD, S, VP_H, VP_W, WIN_H, WIN_W } from "../config";
import { E, useT } from "./anim";
import { Captions, type Cap } from "./caption";
import { BrowserChrome } from "./chrome";
import { Cursor, type CursorKind, type CursorRefs } from "./cursor";

/**
 * Panggung "rekaman layar": jendela browser berisi halaman asli (kelas Tailwind produk), kamera zoom, gulir halaman,
 * dan kursor yang bergerak ke elemen bernama (`data-cur="..."`). Semua posisi diukur dari DOM pada frame yang sedang
 * dirender, jadi kursor selalu tepat di atas tombol/kolom walau tata letak berubah.
 */

export type Pt = [number, number];
/** Nama elemen (`data-cur`) atau koordinat langsung di viewport browser (px logis). */
export type Tgt = string | Pt;

export interface CursorStep {
  /** Detik saat kursor TIBA di tujuan. */
  at: number;
  to: Tgt;
  dx?: number;
  dy?: number;
  /** Lama perjalanan (detik); bila kosong ditentukan dari jarak. */
  dur?: number;
  click?: boolean;
  /** Bentuk kursor selagi berhenti di tujuan ini. */
  kind?: CursorKind;
  /** Lengkung lintasan (bisa negatif). */
  curve?: number;
}
export interface ScrollStep {
  at: number;
  /** Nama elemen yang diletakkan `align` px dari tepi atas viewport, atau posisi gulir mutlak. */
  to: string | number;
  align?: number;
  dur?: number;
}
export interface CamStep {
  at: number;
  zoom: number;
  focus?: Tgt | "cursor";
  dx?: number;
  dy?: number;
  dur?: number;
}
/** Sorot elemen (redup + cincin hijau, seperti tur panduan app). `to` kosong = redupkan seluruh layar. */
export interface SpotStep {
  at: number;
  to?: string | null;
  pad?: number;
  /** Matikan sorotan. */
  off?: boolean;
  /** Kekuatan redup 0..1 (bawaan 0.62). */
  dim?: number;
  dur?: number;
}
export interface Script {
  cursor?: CursorStep[];
  scroll?: ScrollStep[];
  camera?: CamStep[];
  spot?: SpotStep[];
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Cari segmen aktif pada waktu t: tiba di langkah j tepat `at`, berangkat `dur` detik sebelumnya. */
function locate(steps: { at: number; dur?: number }[], t: number, auto: (i: number, j: number) => number, settle: (i: number) => number) {
  const n = steps.length;
  if (n === 0) return null;
  if (t <= steps[0].at) return { i: 0, j: 0, k: 0 };
  for (let j = 1; j < n; j++) {
    if (t < steps[j].at) {
      const i = j - 1;
      const room = steps[j].at - steps[i].at - settle(i);
      const dur = Math.max(0.1, Math.min(steps[j].dur ?? auto(i, j), room));
      const start = steps[j].at - dur;
      if (t <= start) return { i, j: i, k: 0 };
      return { i, j, k: (t - start) / dur };
    }
  }
  return { i: n - 1, j: n - 1, k: 0 };
}

export function Stage({
  url,
  script,
  children,
  fixed,
  canvas,
  captions,
  judulTab,
  favicon,
}: {
  url: string;
  script: Script;
  /** Isi halaman yang ikut tergulir. */
  children: ReactNode;
  /** Lapisan diam di atas viewport (sidebar, modal, tur). */
  fixed?: ReactNode;
  /** Lapisan di atas kamera (ponsel, dll.), koordinat kanvas 1920x1080. */
  canvas?: ReactNode;
  captions?: Cap[];
  judulTab?: string;
  /** Logo kecil merek di pojok kanan bilah browser. */
  favicon?: ReactNode;
}) {
  const t = useT();
  const worldRef = useRef<HTMLDivElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);
  const ctRef = useRef<HTMLDivElement>(null);
  const cur: CursorRefs = {
    root: useRef<HTMLDivElement>(null),
    shape: useRef<HTMLDivElement>(null),
    arrow: useRef<SVGSVGElement>(null),
    text: useRef<SVGSVGElement>(null),
    ripple: useRef<HTMLDivElement>(null),
    ripple2: useRef<HTMLDivElement>(null),
  };
  const spotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const vp = vpRef.current;
    const ct = ctRef.current;
    const world = worldRef.current;
    if (!vp || !ct || !world || !cur.root.current) return;
    const vr = vp.getBoundingClientRect();
    const sx = vr.width / VP_W || 1;

    const centro = (name: string): Pt | null => {
      const el = vp.querySelector(`[data-cur="${name}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [(r.left - vr.left + r.width / 2) / sx, (r.top - vr.top + r.height / 2) / sx];
    };
    const resolve = (tgt: Tgt, dx = 0, dy = 0, key?: string): Pt | null => {
      if (Array.isArray(tgt)) return [tgt[0] + dx, tgt[1] + dy];
      const p = centro(tgt);
      // Tanpa cache antar-frame: tiap tab render memegang frame berbeda, jadi hasil harus murni fungsi frame ini.
      return p ? [p[0] + dx, p[1] + dy] : null;
    };

    // ---- 1. Gulir halaman
    const sc = script.scroll ?? [];
    let scrollY = 0;
    if (sc.length) {
      const maks = Math.max(0, ct.offsetHeight - VP_H);
      const ctTop = ct.getBoundingClientRect().top;
      const nilai: number[] = [];
      sc.forEach((s, i) => {
        if (typeof s.to === "number") return void nilai.push(clamp(s.to, 0, maks));
        const el = vp.querySelector(`[data-cur="${s.to}"]`);
        if (!el) return void nilai.push(nilai[i - 1] ?? 0);
        nilai.push(clamp((el.getBoundingClientRect().top - ctTop) / sx - (s.align ?? 96), 0, maks));
      });
      const L = locate(sc, t, () => 1.2, () => 0);
      if (L) scrollY = lerp(nilai[L.i], nilai[L.j], E.io(clamp(L.k, 0, 1)));
    }
    ct.style.transform = `translate3d(0, ${-scrollY}px, 0)`;

    // ---- 2. Kursor
    const cs = script.cursor ?? [];
    let curPos: Pt = [VP_W / 2, VP_H / 2];
    let bentuk: CursorKind = "arrow";
    let tekan = 1;
    if (cs.length) {
      let terakhir: Pt = [VP_W / 2, VP_H / 2];
      const P: Pt[] = cs.map((s, i) => {
        const p = resolve(s.to, s.dx, s.dy, `c${i}`);
        if (p) terakhir = p;
        return terakhir;
      });
      const jarak = (i: number, j: number) => Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]);
      const L = locate(cs, t, (i, j) => clamp(0.38 + jarak(i, j) / 1500, 0.4, 1), (i) => (cs[i].click ? 0.16 : 0));
      if (L) {
        const a = P[L.i];
        const b = P[L.j];
        if (L.i === L.j) {
          curPos = a;
          bentuk = cs[L.i].kind ?? "arrow";
        } else {
          const e = E.cursor(clamp(L.k, 0, 1));
          const d = jarak(L.i, L.j) || 1;
          const lengkung = (cs[L.j].curve ?? (L.j % 2 === 0 ? 0.09 : -0.09)) * d;
          const mx = (a[0] + b[0]) / 2 + (-(b[1] - a[1]) / d) * lengkung;
          const my = (a[1] + b[1]) / 2 + ((b[0] - a[0]) / d) * lengkung;
          curPos = [(1 - e) ** 2 * a[0] + 2 * (1 - e) * e * mx + e ** 2 * b[0], (1 - e) ** 2 * a[1] + 2 * (1 - e) * e * my + e ** 2 * b[1]];
          bentuk = L.k > 0.92 ? (cs[L.j].kind ?? "arrow") : "arrow";
        }
      }
      // Klik: kursor menekan sebentar + riak hijau
      const rip = cur.ripple.current;
      const rip2 = cur.ripple2.current;
      let riak = -1;
      for (let i = 0; i < cs.length; i++) {
        if (!cs[i].click) continue;
        const age = t - (cs[i].at + 0.05);
        if (age >= -0.08 && age < 0.7) {
          const dip = age < 0 ? 1 - ((age + 0.08) / 0.08) * 0.16 : age < 0.12 ? 0.84 + (age / 0.12) * 0.16 : 1;
          tekan = Math.min(tekan, dip);
          if (age >= 0) riak = age;
        }
      }
      if (rip && rip2) {
        if (riak >= 0) {
          const k = E.out(clamp(riak / 0.6, 0, 1));
          const r = 6 + k * 30;
          Object.assign(rip.style, { width: `${r * 2}px`, height: `${r * 2}px`, left: `${2 - r}px`, top: `${2 - r}px`, opacity: String(1 - k) });
          const r2 = 4 + k * 20;
          Object.assign(rip2.style, { width: `${r2 * 2}px`, height: `${r2 * 2}px`, left: `${2 - r2}px`, top: `${2 - r2}px`, opacity: String((1 - k) * 0.9) });
        } else {
          rip.style.opacity = "0";
          rip2.style.opacity = "0";
        }
      }
    }

    // ---- 3a. Sorotan (tur panduan / penekanan elemen)
    const sp = script.spot ?? [];
    const spotEl = spotRef.current;
    if (spotEl) {
      if (!sp.length) spotEl.style.display = "none";
      else {
        const R = sp.map((s, i) => {
          if (!s.to) return [VP_W / 2, VP_H / 2, 0, 0];
          const el = vp.querySelector(`[data-cur="${s.to}"]`);
          if (!el) return [VP_W / 2, VP_H / 2, 0, 0];
          const r = el.getBoundingClientRect();
          const pd = s.pad ?? 6;
          const v = [(r.left - vr.left) / sx - pd, (r.top - vr.top) / sx - pd, r.width / sx + pd * 2, r.height / sx + pd * 2];
          return v;
        });
        const L = locate(sp, t, () => 0.5, () => 0);
        if (L) {
          const e = E.io(clamp(L.k, 0, 1));
          const a = R[L.i];
          const b = R[L.j];
          const v = a.map((x, n) => lerp(x, b[n], e));
          const al = lerp(sp[L.i].off ? 0 : (sp[L.i].dim ?? 0.62) / 0.62, sp[L.j].off ? 0 : (sp[L.j].dim ?? 0.62) / 0.62, e);
          if (al < 0.01) spotEl.style.display = "none";
          else {
            Object.assign(spotEl.style, {
              display: "block",
              left: `${v[0]}px`,
              top: `${v[1]}px`,
              width: `${v[2]}px`,
              height: `${v[3]}px`,
              boxShadow: `${v[2] > 6 ? `0 0 0 2px rgba(61,220,151,${al}), ` : ""}0 0 0 9999px rgba(11,24,19,${0.62 * al})`,
            });
          }
          const kartu = vp.querySelector("[data-tour-card]") as HTMLElement | null;
          if (kartu) {
            if (v[2] < 6) Object.assign(kartu.style, { left: "50%", top: "50%", bottom: "auto", transform: "translate(-50%, -50%)" });
            else {
              const bawah = v[1] + v[3] + 270 < VP_H;
              Object.assign(kartu.style, {
                left: `${clamp(v[0], 16, VP_W - 376)}px`,
                transform: "none",
                top: bawah ? `${v[1] + v[3] + 12}px` : "auto",
                bottom: bawah ? "auto" : `${VP_H - v[1] + 12}px`,
              });
            }
          }
        }
      }
    }

    // ---- 3. Kamera
    const cm = script.camera ?? [];
    let z = 1;
    let fx = VP_W / 2;
    let fy = VP_H / 2;
    if (cm.length) {
      const F = cm.map((c, i) => (c.focus === "cursor" ? curPos : c.focus ? resolve(c.focus, c.dx, c.dy, `m${i}`) : null));
      const L = locate(cm, t, () => 1.15, () => 0);
      if (L) {
        const e = E.io(clamp(L.k, 0, 1));
        const ctr: Pt = [VP_W / 2, VP_H / 2];
        const fi = F[L.i] ?? F[L.j] ?? ctr;
        const fj = F[L.j] ?? F[L.i] ?? ctr;
        z = lerp(cm[L.i].zoom, cm[L.j].zoom, e);
        fx = lerp(fi[0], fj[0], e);
        fy = lerp(fi[1], fj[1], e);
      }
    }
    const wx = PAD + fx * S;
    const wy = PAD + (CHROME_H + fy) * S;
    const hw = CW / (2 * z);
    const hh = CH / (2 * z);
    const cx = PAD + hw > CW - PAD - hw ? CW / 2 : clamp(wx, PAD + hw, CW - PAD - hw);
    const cy = PAD + hh > CH - PAD - hh ? CH / 2 : clamp(wy, PAD + hh, CH - PAD - hh);
    world.style.transform = `translate3d(${CW / 2 - cx * z}px, ${CH / 2 - cy * z}px, 0) scale(${z})`;

    // ---- 4. Terapkan kursor (dengan kompensasi zoom supaya tidak raksasa saat kamera mendekat)
    const comp = 1 / Math.sqrt(z);
    cur.root.current.style.transform = `translate3d(${curPos[0]}px, ${curPos[1]}px, 0) scale(${comp})`;
    if (cur.shape.current) cur.shape.current.style.transform = `scale(${tekan})`;
    if (cur.arrow.current) cur.arrow.current.style.display = bentuk === "arrow" ? "block" : "none";
    if (cur.text.current) cur.text.current.style.display = bentuk === "text" ? "block" : "none";
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop />
      <div ref={worldRef} style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, transformOrigin: "0 0" }}>
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: PAD,
            width: WIN_W,
            height: WIN_H,
            transform: `scale(${S})`,
            transformOrigin: "0 0",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 40px 90px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)",
            background: "#fff",
          }}
        >
          <BrowserChrome url={url} judul={judulTab} favicon={favicon} />
          <div ref={vpRef} className="font-sans text-fg" style={{ position: "absolute", left: 0, top: CHROME_H, width: VP_W, height: VP_H, overflow: "hidden", background: "var(--c-canvas)" }}>
            <div ref={ctRef} style={{ width: VP_W, willChange: "transform" }}>
              {children}
            </div>
            {fixed}
            <div ref={spotRef} className="pointer-events-none absolute z-[100]" style={{ display: "none", borderRadius: 16 }} />
            <Cursor refs={cur} />
          </div>
        </div>
      </div>
      {canvas}
      {captions && <Captions items={captions} />}
    </AbsoluteFill>
  );
}

/** Latar panggung: warna latar + pendar aksen (radial-gradient, bukan filter blur: murah dirender) + kisi tipis. */
export function Backdrop() {
  return (
    <AbsoluteFill style={{ background: BRAND.latar }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          WebkitMaskImage: "radial-gradient(130% 100% at 100% 100%, #000 20%, transparent 75%)",
          maskImage: "radial-gradient(130% 100% at 100% 100%, #000 20%, transparent 75%)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(900px 700px at 50% -8%, ${BRAND.aksen}33, transparent 70%), radial-gradient(800px 600px at 100% 100%, rgba(47,91,255,0.12), transparent 70%)` }} />
    </AbsoluteFill>
  );
}
