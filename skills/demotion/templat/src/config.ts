/**
 * Ukuran, waktu, dan merek video demo. Semua waktu di skrip adalah DETIK (bukan frame) supaya FPS bisa diganti
 * (REMOTION_FPS=30 untuk pratinjau cepat, 60 untuk hasil akhir yang mulus).
 */
export const FPS = Number(process.env.REMOTION_FPS) || 60;

/** Kanvas video. */
export const CW = 1920;
export const CH = 1080;

/** Jendela browser: lebar logis 1440 px (layout desktop), diskalakan S kali ke kanvas. */
export const PAD = 40;
export const WIN_W = 1440;
export const S = (CW - PAD * 2) / WIN_W;
export const WIN_H = (CH - PAD * 2) / S;
export const CHROME_H = 52;
export const VP_W = WIN_W;
export const VP_H = WIN_H - CHROME_H;

/** Merek & warna panggung (isi dari token warna produk; aksen = warna sinyal/utama merek di latar gelap). */
export const BRAND = {
  nama: "__NAMA__",
  domain: "__DOMAIN__",
  aksen: "__AKSEN__",
  /** Warna teks di atas aksen (kontras) & warna latar panggung. */
  tinta: "#0b1813",
  latar: "#06100c",
  /** Latar caption (hampir solid; hindari backdrop-filter, mahal) & warna teks sekundernya. */
  kaca: "rgba(8,20,15,0.95)",
  redup: "#93a99f",
};
