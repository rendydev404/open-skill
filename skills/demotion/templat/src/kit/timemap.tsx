import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import { FPS } from "../config";

/**
 * Pemetaan waktu (potong + percepat). Tiap scene adalah fungsi murni dari waktu aslinya `t`; video yang dirender
 * cukup memutar `t` lewat daftar segmen: [a, b] detik asli diputar dengan kecepatan v (v > 1 = dipercepat), bagian
 * yang tidak tercantum dilewati (potongan lompat). Semua hook waktu (`useT`) otomatis memakai peta ini.
 */
export interface Seg {
  a: number;
  b: number;
  v: number;
}
export const S = (a: number, b: number, v = 1): Seg => ({ a, b, v });

export interface Peta {
  segs: Seg[];
  /** Awal tiap segmen pada waktu video (detik). */
  mulai: number[];
  /** Durasi video scene setelah dipotong/dipercepat. */
  dur: number;
  /** Waktu video tempat terjadi potongan lompat (segmen tidak menyambung). */
  potongan: number[];
}

export function bangunPeta(segs: Seg[]): Peta {
  const mulai: number[] = [];
  const potongan: number[] = [];
  let x = 0;
  segs.forEach((s, i) => {
    mulai.push(x);
    if (i > 0 && Math.abs(s.a - segs[i - 1].b) > 0.05) potongan.push(x);
    x += (s.b - s.a) / s.v;
  });
  return { segs, mulai, dur: x, potongan };
}

export interface Waktu {
  /** Waktu asli scene (detik) yang harus ditampilkan. */
  t: number;
  /** Kecepatan putar saat ini. */
  v: number;
}

export function waktuAsli(p: Peta, tv: number): Waktu {
  const n = p.segs.length;
  let i = 0;
  for (let k = 0; k < n; k++) {
    if (tv >= p.mulai[k]) i = k;
  }
  const s = p.segs[i];
  const dt = Math.min(Math.max(0, tv - p.mulai[i]), (s.b - s.a) / s.v);
  return { t: s.a + dt * s.v, v: s.v };
}

export const KonteksWaktu = createContext<Peta | null>(null);

/** Waktu asli + kecepatan untuk frame saat ini (tanpa peta = waktu apa adanya). */
export function useWaktu(): Waktu {
  const tv = useCurrentFrame() / FPS;
  const p = useContext(KonteksWaktu);
  return p ? waktuAsli(p, tv) : { t: tv, v: 1 };
}
