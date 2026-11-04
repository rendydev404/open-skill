import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../config";
import { useWaktu } from "./timemap";

/** Detik sejak awal Sequence terdekat (lokal tiap scene). */
export const useT = () => useWaktu().t;

export const E = {
  io: Easing.bezier(0.45, 0, 0.2, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  cursor: Easing.bezier(0.36, 0, 0.14, 1),
  lin: (x: number) => x,
};

/** Interpolasi terjepit: nilai dari `a` ke `b` selama t0..t1 (detik). */
export function tw(t: number, t0: number, t1: number, a = 0, b = 1, ease: (x: number) => number = E.io): number {
  if (t1 <= t0) return t >= t1 ? b : a;
  return interpolate(t, [t0, t1], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
}

/** Pegas ringan 0..1 mulai dari t0 (detik). */
export function pegas(t: number, t0: number, damping = 16, stiffness = 160): number {
  if (t < t0) return 0;
  return spring({ frame: (t - t0) * FPS, fps: FPS, config: { damping, stiffness, mass: 0.8 } });
}

/** Masuk (naik + muncul) lalu keluar. Mengembalikan 0..1 untuk opasitas/geser. */
export function tampil(t: number, dari: number, sampai: number, masuk = 0.35, keluar = 0.3): number {
  return Math.min(tw(t, dari, dari + masuk, 0, 1, E.out), 1 - tw(t, sampai - keluar, sampai, 0, 1, E.io));
}

/** Teks yang diketik: `cps` karakter per detik mulai t0. */
export function ketik(teks: string, t: number, t0: number, cps = 14): string {
  const n = Math.max(0, Math.min(teks.length, Math.floor((t - t0) * cps)));
  return teks.slice(0, n);
}

/** Berapa detik yang dibutuhkan mengetik `teks`. */
export const lamaKetik = (teks: string, cps = 14) => teks.length / cps;

/** Kedip karet (caret) teks. */
export const kedip = (t: number) => Math.floor(t * 2.4) % 2 === 0;

/** Putaran spinner (derajat) sebagai fungsi waktu. */
export const putar = (t: number, rps = 1.1) => ((t * rps * 360) % 360);

export const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
export const angka = (n: number) => n.toLocaleString("id-ID");
