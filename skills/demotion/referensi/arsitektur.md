# Arsitektur engine demotion

Semua kode ada di `templat/src` (disalin ke `<video>/src/demo`). Ringkasan API yang dipakai saat menulis scene.

## Konsep

- **Waktu = detik ASLI scene.** `useT()` mengembalikan `t` (detik) setelah dilewatkan peta potong/percepat
  (`kit/timemap.tsx`). Scene tidak perlu tahu soal percepatan; ia hanya fungsi dari `t`.
- **Stage** (`kit/stage.tsx`) = jendela browser di kanvas 1920x1080 (padding 40, skala S = 1840/1440). Isi halaman
  berukuran logis 1440 px lebar (layout desktop). Stage menghitung SEMUA posisi dari DOM pada frame yang dirender
  (`useLayoutEffect`, tanpa cache): gulir, kursor, sorotan, kamera.
- **Target elemen** = atribut `data-cur="nama"` di elemen. Stage mengukur pusat elemen itu pada frame ini, jadi kursor
  selalu tepat walau layout berubah. Tujuan juga bisa koordinat `[x, y]` (px logis viewport).
- **Layer**: `children` = isi halaman yang ikut tergulir; `fixed` = lapisan diam di atas viewport (sidebar, modal,
  kartu tur); `canvas` = lapisan di atas kamera, koordinat kanvas 1920x1080 (ponsel, notifikasi, lencana);
  `captions` = keterangan di bawah layar.

## Script

```ts
const script: Script = {
  cursor: [
    { at: 0, to: [1100, 500] },                              // posisi awal
    { at: 2.0, to: "tombol-daftar", click: true },           // TIBA di elemen pada detik 2.0, lalu klik
    { at: 5.0, to: "isi-nama", kind: "text", click: true },  // bentuk I-beam saat berhenti
    { at: 7.0, to: [900, 400], dur: 0.1 },                   // koordinat eksplisit (cepat)
  ],
  scroll: [{ at: 0, to: 0 }, { at: 9.5, to: "sec-harga", align: -64, dur: 2 }],
  camera: [{ at: 0, zoom: 1 }, { at: 4.5, zoom: 1.35, focus: "isi-nama", dur: 1 }, { at: 8, zoom: 1, dur: 1 }],
  spot: [{ at: 1, to: null }, { at: 3, to: "btn-tambah" }, { at: 6, off: true }],   // tur/sorotan
};
```

- **Langkah = "tiba pada detik `at`"**. Berangkatnya otomatis `at - dur` (dur otomatis dari jarak, 0.4-1 dtk), tidak
  pernah sebelum langkah sebelumnya selesai (+0,16 dtk bila langkah sebelumnya klik). Lintasan melengkung halus
  (`curve`), ease keluar-masuk.
- **Klik**: `click: true` → kursor menekan (skala 0,84) + riak aksen sejak `at`. UI harus berubah ±0,1 dtk SETELAH
  `at`. Simpan waktu kejadian di satu objek `T` yang dipakai BERSAMA oleh isi halaman dan skrip kursor.
- **`kind: "text"`** = kursor I-beam saat berhenti di kolom isian.
- **Gulir**: `to` = nama elemen (diletakkan `align` px dari atas viewport; negatif = elemen di atas viewport, berguna
  bila section punya padding atas besar) atau angka px. Jangan menggulir selagi kursor berhenti di elemen bernama
  (elemen ikut bergerak): beri langkah kursor ke koordinat saat menggulir.
- **Kamera**: `zoom` + `focus` (nama/koordinat/`"cursor"`). Kamera dikunci di dalam batas jendela. Kursor otomatis
  diperkecil `1/sqrt(zoom)` supaya tidak raksasa.
- **Sorotan (`spot`)**: redup layar + cincin hijau di sekitar elemen (seperti tur panduan). `to: null` = redup penuh.
  Kartu tur memakai atribut `data-tour-card` agar diposisikan otomatis (di bawah/atas elemen).

## Pola waktu di isi halaman

```ts
import { E, ketik, tw, pegas, tampil, kedip, useT } from "../kit/anim";
const t = useT();
const nama = ketik("Rini Handayani", t, T.ketik, 12);      // teks diketik (12 karakter/dtk)
const saklar = tw(t, T.klik + 0.1, T.klik + 0.35, 0, 1, E.out);   // 0..1 mulus
const buka = pegas(t, T.dialog);                           // pegas 0..1
```
`tw(t, t0, t1, a, b, ease)` interpolasi terjepit; `E.io/out/in/cursor/lin` easing; `tampil(t, dari, sampai)` untuk
muncul-lalu-hilang; `putar(t)` untuk spinner; `kedip(t)` caret.

## Peta potong/percepat (`kit/timemap.tsx`, `scenes/potong.ts`)

`POTONG[id] = [S(a, b, v), ...]` dalam detik asli: segmen diputar dengan kecepatan v, celah antar-segmen = potongan
lompat (dip singkat di Root). `useT()` dan `Captions` otomatis memakai peta ini; caption yang tampil <1,2 dtk setelah
dipercepat disembunyikan. Lencana "Nx" tampil di Root saat v ≥ 1,9.

## Kit lain

- `kit/phone.tsx`: `Phone` (iPhone datar, layar logis 390x844, `scale`), `WaScreen` (chat WhatsApp iOS: gelembung
  `Gel[]` dengan `muncul` 0..1, indikator mengetik, input), `FotoBukti`, `Spin`.
- `kit/atoms.tsx`: `Pill`, `Saklar(p)`, `Meter`, `Isi` (kolom diketik + caret), `LatarDialog(p)`.
- `kit/chrome.tsx`: bilah browser. `kit/caption.tsx`: `Captions` + tipe `Cap` (`pos: "atas"` memindah ke atas).

## Struktur scene yang dianjurkan

```
src/demo/
  data.ts            // data demo fiktif bersama (nama usaha, nomor, harga, teks panjang)
  pages/*.tsx        // komponen halaman/produk hasil salinan dari kode aplikasi (props statis)
  scenes/<id>.tsx    // export const DUR, export function <Id>()
  scenes/index.ts    // urutan scene (buat("<id>", Komp, DUR))
  scenes/potong.ts   // peta potong+percepat
```
