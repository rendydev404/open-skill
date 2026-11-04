import { ArrowRight } from "lucide-react";
import { E, ketik, tw, useT } from "../kit/anim";
import { Isi, Saklar } from "../kit/atoms";
import type { Cap } from "../kit/caption";
import { type Script, Stage } from "../kit/stage";

/** Durasi scene (detik ASLI, sebelum dipotong). Wajib diekspor; dipakai registry scenes/index.ts. */
export const DUR = 14;

/** Waktu kejadian UI dikumpulkan di satu tempat: dipakai BERSAMA oleh isi halaman dan skrip kursor supaya selalu sinkron. */
const T = { klikNama: 1.6, ketikNama: 1.9, klikSaklar: 7.2, klikKirim: 10.2 };
const NAMA = "Rini Handayani";

/**
 * SCENE CONTOH = pola semua scene: (1) isi halaman = fungsi murni dari waktu t; (2) skrip kursor/gulir/kamera berisi
 * langkah "TIBA di tujuan pada detik at"; (3) caption edukatif. Salin berkas ini lalu ganti isinya dengan halaman
 * produk yang disalin dari kode aplikasi (kelas Tailwind apa adanya).
 */
export function Contoh() {
  const t = useT();
  const nama = ketik(NAMA, t, T.ketikNama, 12);
  const fokusNama = t >= T.klikNama + 0.1 && t < T.klikSaklar - 0.5;
  const saklar = tw(t, T.klikSaklar + 0.1, T.klikSaklar + 0.35, 0, 1, E.out);
  const terkirim = t >= T.klikKirim + 0.1;

  const script: Script = {
    cursor: [
      { at: 0, to: [1100, 500] }, // posisi awal (koordinat viewport logis)
      { at: T.klikNama, to: "isi-nama", kind: "text", click: true },
      { at: T.klikSaklar - 0.05, to: "saklar", click: true },
      { at: T.klikKirim - 0.05, to: "tombol-kirim", click: true },
      { at: 13, to: [900, 420] },
    ],
    camera: [
      { at: 0, zoom: 1 },
      { at: 1.2, zoom: 1.35, focus: "isi-nama", dur: 1.0 },
      { at: 8.5, zoom: 1, dur: 1.0 },
    ],
  };

  const caps: Cap[] = [
    { from: 0.6, to: 4.8, label: "1 · CONTOH", title: "Isi nama Anda", sub: "Kursor bergerak ke kolom, mengetik, lalu kamera mendekat" },
    { from: 6.4, to: 9.8, label: "1 · CONTOH", title: "Nyalakan fitur dengan satu klik", sub: "Saklar bergeser mulus dari waktu, bukan animasi CSS" },
    { from: 10.4, to: 13.4, label: "1 · CONTOH", title: terkirim ? "Terkirim!" : "Kirim", sub: "Ganti scene ini dengan halaman produk sungguhan" },
  ];

  return (
    <Stage url="/contoh" script={script} captions={caps}>
      <div className="mx-auto max-w-[640px] pt-24">
        <div className="card space-y-5 p-8">
          <h1 className="text-[26px] font-bold tracking-tight">Halaman contoh</h1>
          <Isi label="Nama" nilai={nama} placeholder="Nama lengkap" fokus={fokusNama} t={t} cur="isi-nama" />
          <label className="flex items-center justify-between">
            <span className="text-[13.5px] font-semibold">Aktifkan fitur</span>
            <Saklar p={saklar} cur="saklar" />
          </label>
          <span data-cur="tombol-kirim" className="btn btn-primary w-full">
            {terkirim ? "Terkirim ✓" : <>Kirim <ArrowRight className="size-4" /></>}
          </span>
        </div>
      </div>
    </Stage>
  );
}
