# Jebakan yang pernah terjadi (dan solusinya)

Baca sebelum menulis scene. Semuanya benar-benar terjadi saat membangun demo ChatGerCep.

## Render & kecepatan

1. **Proses render yatim.** Menghentikan tugas latar (TaskStop/Ctrl+C) TIDAK membunuh `node remotion-cli`,
   `chrome-headless-shell`, `ffmpeg` anaknya. Render lama terus jalan dan berebut CPU: render baru tampak 3x lebih
   lambat dan uji kecepatan menyesatkan. → Jalankan `skrip/bersihkan-proses.ps1` sebelum/ sesudah menghentikan render,
   dan cek beban CPU sebelum benchmark.
2. **Efek mahal.** `filter: blur()`, `backdrop-filter`, kelas `blur-3xl`, `backdrop-blur-*` pada elemen besar dihitung
   ulang tiap frame. → Ganti dengan `radial-gradient` (tampilan sama), caption dengan latar hampir solid. Dialog
   backdrop boleh blur bila singkat.
3. **Kecepatan nyata**: ±8 fps CPU-saja → ±12-18 fps dengan `--gl=angle` (GPU). Ukur dulu di 240 frame
   (`--frames=1200-1439`) pada scene terberat sebelum merender semua. Beban CPU 90% = menambah `--concurrency` percuma.
4. **Timeout tugas latar.** Jangan memberi `timeout` kecil pada render panjang; jalankan dengan `run_in_background`.

## Kode scene

5. **`ReferenceError: React is not defined`.** JSX di tingkat modul (konstanta/array berisi `<p>…</p>` di luar
   komponen) dievaluasi sebelum `React` global siap saat bundling → SELURUH komposisi gagal. → Jadikan fungsi yang dipanggil
   saat render, atau `import React from "react"` di berkas itu.
6. **Cache lintas-frame.** Menyimpan posisi elemen di `useRef` untuk dipakai frame lain tidak deterministik: render
   paralel memberi tiap tab frame berbeda. → Hitung semuanya dari frame ini saja. Bila target (mis. tombol modal)
   hilang setelah klik, tambah langkah kursor ke koordinat `[x,y]` eksplisit (`dur: 0.1`) SEBELUM elemen hilang, atau
   biarkan elemen tetap ter-mount (opasitas 0).
7. **Animasi/transisi CSS** (`animate-*`, `transition-*`, `hover:`) berjalan di jam browser, bukan frame → berkedip
   atau tak bergerak. → Buang dari CSS & kelas; semua gerak dari `t` (`tw`, `pegas`, `ketik`, `putar`).
8. **Breakpoint Tailwind.** Media query memakai lebar jendela headless (1920), bukan 1440 logis. Varian `2xl:` aktif
   padahal layout 1440 tidak memilikinya. → Tulis kelas desktop eksplisit (mis. `grid-cols-2`) dan jangan menyalin
   varian `2xl:`/`max-[…]:`. `lg:`/`xl:` aman.
9. **`position: sticky`/`fixed` di konten tergulir.** Gulir dilakukan lewat `transform`, jadi `sticky` mati dan
   `fixed` ikut bergeser. → Elemen diam (sidebar, modal, tur, bilah navigasi lengket) masuk prop `fixed`.
10. **Gulir saat kursor berhenti di elemen bernama**: kursor ikut menempel pada elemen yang bergerak. → Saat menggulir,
    parkir kursor di koordinat.
11. **`align` gulir.** Section dengan padding atas besar (py-28) membuat judul tampak jauh di bawah. → `align` negatif.
12. **Waktu kejadian tersebar.** Klik di skrip dan perubahan UI di halaman harus memakai konstanta `T` yang sama.

## Konten & akurasi

13. **Klaim yang salah ketahuan user.** Selalu verifikasi ke kode: default serah-terima, apakah fitur memakai kuota,
    mesin AI bawaan, harga/kuota paket, batas karakter. Tulis sumber (file:baris) di catatan storyboard.
14. **Angka tak konsisten antar scene** (mis. 686 vs 779 karakter, total pesanan vs nominal bukti transfer). Satu
    `data.ts`; angka turunan dihitung dari konstanta (mis. `HASIL_RAPI.length`).
15. **Loading AI nyata 10-40 dtk**: percepat dan beri tahu di caption ("dipercepat").
16. **Caption menutupi tombol** yang diklik → `pos: "atas"` atau geser waktunya; ukuran bar bawah ±95 px.
17. **Teks UI dikarang** padahal ada di kode: salin persis. Teks yang memang karangan (tanggal, ukuran berkas, pesan
    sukses) catat di laporan akhir ke user.

## Alat

18. **ffmpeg bawaan Remotion** (`npx remotion ffmpeg`) tidak punya filter `fps`/`tile`/`select` penuh. → Ambil frame
    dengan `-ss` satu per satu dan susun lembar kontak dengan Pillow (`skrip/lembar-kontak.py`).
19. **Bundel bersama rusak** bila beberapa fork menulis berkas setengah jadi yang diimpor registry. → Fork merender
    lewat entri uji sendiri atau `--bundle-cache=false`, dan hanya mengedit berkasnya sendiri; registry diedit orkestrator.
20. **Windows**: `cd` mengubah cwd sesi berikutnya (pakai path absolut); heredoc berisi `'`/`"` campur bisa gagal di
    Bash → tulis berkas dengan tool Write. `process.env.REMOTION_FPS` butuh `@types/node`; impor `*.css` butuh `env.d.ts`.
21. **`SendUserFile` maksimum 30 MB** (file besar hanya terlihat di aplikasi desktop). → `skrip/kompres.mjs`.
22. **Pixel format** keluaran `yuvj420p` (rentang penuh) tidak masalah di pemutar umum; salinan kompres memakai `yuv420p`.
23. **Scaffold/paket**: bila repo akar memakai Next/ESLint, `exclude`/`globalIgnores` folder video; tambahkan
    `.gitignore` (`node_modules`, `out`) di folder video agar tidak muncul sebagai berkas baru di git.
