# Menulis scene paralel dengan subagent fork

Pakai bila ada ≥6 scene yang saling bebas. Fork mewarisi seluruh konteks (sumber yang sudah dibaca, kit), jadi brief
pendek cukup — tetapi harus mendefinisikan KEPEMILIKAN BERKAS dan aturan umum.

## Orkestrator menyiapkan DULU (sebelum fork)

1. `scaffold.mjs` + `index.css`/`fonts.ts`/`BRAND` + uji satu scene contoh dan satu scene sungguhan (mis. landing)
   sampai pipeline terbukti jalan.
2. `data.ts` (data demo fiktif bersama) dan halaman yang dipakai banyak scene (`pages/dashboard.tsx`,
   `pages/<kerangka-halaman>.tsx` dengan slot per bagian).
3. Stub tiap scene: `export const DUR = N; export function X() { return null; }` dan registry `scenes/index.ts`
   yang sudah mengimpor semuanya — fork TIDAK mengedit registry.

## Pembagian

Satu fork per kelompok 2-3 scene berurutan yang memakai komponen sama. Tiap fork memiliki: `scenes/<id>.tsx` miliknya +
berkas baru `pages/<huruf>-*.tsx` berawalan unik. Dilarang mengubah: `kit/*`, `data.ts`, halaman bersama, `Root.tsx`,
`config.ts`, `index.css`, `scenes/index.ts`, scene fork lain.

## Templat brief (isi tiap `<…>`)

```
Kamu FORK <A>. Tulis scene <id1> (DUR≈..), <id2> (DUR≈..) di <video>/src/demo/scenes/ (stub sudah ada; timpa).

ATURAN: hanya edit berkas milikmu + pages/<a>-*.tsx baru. Ikuti pola scenes/<scene-referensi>.tsx (Stage, useT, data-cur,
script). Tanpa animasi CSS; semua gerak dari t. Salin UI dari kode aplikasi (kelas Tailwind persis, teks persis). Data dari
data.ts. Klaim caption harus terverifikasi di kode (catat file:baris di laporan). Label bab "<N · NAMA>".
Verifikasi: REMOTION_FPS=30 npx remotion still src/demo/index.ts S-<id> out/<id>-<frame>.png --frame=<N>
--config=remotion.demo.config.ts --bundle-cache=false di 6-10 momen, lihat gambarnya, perbaiki. Typecheck:
npx tsc --noEmit -p tsconfig.json. Jangan commit. Nama keluaran out/<id>-… milikmu saja.
Laporan akhir singkat: nilai DUR, hal yang karangan/perlu dicek, kendala.

SCENE <id1>: <halaman, urutan aksi kursor, state UI per waktu, caption, data>
SCENE <id2>: …
```

## Setelah fork selesai

- Jalankan `tsc`, lalu `remotion compositions` (cek semua komposisi terdaftar), render still tengah tiap scene dan lihat.
- Waspadai: JSX tingkat modul (`React is not defined`), target elemen sekali-pakai (kursor melompat), angka yang tak
  konsisten antar scene, klaim karangan fork (minta daftar "karangan" di laporannya).
- Fork bisa melapor bug kit; perbaiki di kit oleh orkestrator, bukan oleh fork.
