---
name: demotion
description: Membuat (atau memperbarui) video demo produk/sistem OTOMATIS dengan Remotion — rekaman layar bergaya Screen Studio memakai tampilan ASLI aplikasi (kelas Tailwind & markup disalin dari kode), kursor yang bergerak natural + klik, zoom kamera, gulir halus, caption edukatif tentang product knowledge, potong & percepat ke 1-2 menit, render 1080p 60fps lalu kompres untuk dikirim. Pakai setiap kali user minta "buat demo", "video demo", "demo sistem", "screen recording", "walkthrough", "product tour", "video promosi dari tampilan asli", "demotion", atau meminta demo lama diperbarui setelah fitur baru.
allowed-tools:
  - Bash
  - PowerShell
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - SendUserFile
---

# demotion — demo sistem otomatis dari tampilan asli aplikasi

Hasil akhir: satu `.mp4` (1920x1080, 60 fps, 1-2 menit) yang tampak seperti rekaman layar profesional dari aplikasi
yang SUNGGUHAN, tetapi digerakkan sepenuhnya dari kode Remotion sehingga mulus (tanpa patah-patah rekaman nyata), bisa
diulang, dan mudah diperbarui saat fitur berubah.

Bahasa kerja: **Indonesia** (balasan, recap, caption video). Jangan membuka Chrome/login aplikasi lokal untuk "melihat"
UI: sumber kebenaran tampilan adalah KODE; hasil diperiksa lewat still/video Remotion.

## Prinsip yang tidak boleh dilanggar

1. **UI asli, bukan tiruan.** Salin markup + string kelas Tailwind + token warna + font dari kode aplikasi. Teks UI
   (judul, label, hint, pesan) disalin persis. Jangan menggambar ulang "mirip".
2. **Kebenaran produk dari KODE.** Setiap klaim di caption (harga, kuota, default, batas, siapa yang bayar apa)
   dibaca dari kode/konfigurasi, bukan ingatan atau tebakan. Contoh nyata: "Uji bot memakai kuota?" → cek route API-nya
   dan fungsi pencatat pemakaian sebelum menulis caption. Yang tidak ada di kode jangan diklaim.
3. **Semua gerak dihitung dari waktu video.** Tanpa animasi/transisi CSS, tanpa `setTimeout`, tanpa state/cache lintas
   frame: tiap frame = fungsi murni dari `t`. (Render paralel membagi frame ke banyak tab.)
4. **Data demo fiktif, konsisten, aman.** Satu usaha/tokoh fiktif, nomor/email/rekening placeholder, angka yang sama di
   semua scene. Jangan memakai data pelanggan nyata. Statistik "setelah beberapa hari" diberi caption "contoh data".
5. **Durasi 1-2 menit** kecuali diminta lain: potong bagian menunggu dan percepat pengetikan/loading (3-8x) dengan
   lencana "4x"; bagian yang perlu dibaca tetap 1-2x. Caption harus terbaca ≥1,2 detik setelah dipercepat.
6. **Verifikasi dengan mata**: render still per momen kunci dan LIHAT (Read gambar) sebelum render akhir.

## Alur kerja

### Fase 0 — Deteksi & tujuan
- Cari demo yang sudah ada: `**/src/demo/kit/stage.tsx`. **Ada →** jangan scaffold ulang; masuk "Memperbarui demo".
- Tidak ada → butuh proyek video. Lokasi bawaan: `<repo>/video/` (folder terpisah; tambahkan ke `exclude` tsconfig
  akar dan `globalIgnores` ESLint bila repo memakai Next/ESLint supaya build/CI aplikasi tidak ikut memeriksanya).
- Tanyakan SATU kali hanya yang tak bisa disimpulkan: target durasi, ada suara/narasi atau tidak, bagian yang wajib
  tampil. Bawaan: caption Indonesia, tanpa suara, ≤2 menit, perjalanan pengguna dari nol sampai fitur utama.

### Fase 1 — Riset produk (baca kode, jangan menebak)
Untuk tiap halaman/fitur yang akan tampil, baca: rute (`app/**/page.tsx`), komponen, teks UI, paket/harga/kuota, aturan
default, batas, teks tur/onboarding (ini sumber product knowledge terbaik), alur pembayaran, role. Catat di
`referensi/storyboard.md` format-nya: `halaman → apa yang ditunjukkan → caption → klaim yang diverifikasi (file:baris)`.
Bagi pembaca-kode yang banyak ke subagent Explore bila perlu; keputusan akhir tetap di Anda.

### Fase 2 — Storyboard
Susun 8-14 scene mengikuti perjalanan pengguna (landing → daftar → mulai/onboarding → pengaturan inti → momen "wow"
→ pantau → bayar/langganan → ajakan). Tiap scene: tujuan, durasi asli, langkah kursor, caption. Lihat
`referensi/storyboard.md` (pola caption, tempo, label bab "N · NAMA").

### Fase 3 — Scaffold
```bash
node "$HOME/.claude/skills/demotion/skrip/scaffold.mjs" --dest <repo>/video --nama "Produk" --domain produk.com --aksen "#3ddc97" --install
```
Menyalin engine (`src/demo/kit/*`), kerangka Root, scene contoh, konfigurasi Tailwind v4. Lalu:
- Salin **token warna + kelas komponen** CSS aplikasi ke `src/demo/index.css` (hapus animasi/transisi).
- Ganti font di `src/demo/fonts.ts` dengan font yang dipakai aplikasi (`@fontsource/<nama>`); muat semua bobot dipakai.
- Isi `BRAND` di `config.ts` (nama, domain, warna aksen di latar gelap).
- Uji: `REMOTION_FPS=30 npx remotion still src/demo/index.ts S-contoh out/uji.png --frame=270 --config=remotion.demo.config.ts`.
Hapus `scenes/contoh.tsx` setelah scene sungguhan ada.

### Fase 4 — Port UI & tulis scene
- Komponen produk → `src/demo/pages/*.tsx` (salin markup/kelas; ganti data & handler dengan props statis). Atom generik
  ada di `kit/atoms.tsx`; ponsel WhatsApp di `kit/phone.tsx`.
- Satu scene = satu berkas `scenes/<id>.tsx` yang mengekspor `DUR` (detik asli) dan komponen; daftarkan di
  `scenes/index.ts` dengan `buat("<id>", Komp, DUR_X)`. Pola lengkap: `templat/src/scenes/contoh.tsx` dan
  `referensi/arsitektur.md` (API Stage: cursor/scroll/camera/spot, `data-cur`, waktu kejadian bersama `T`).
- **Sidebar/modal/tur = layer `fixed`** (tidak ikut tergulir), isi halaman = children.
- Scene ≥6 dan independen → **paralelkan dengan fork** (lihat `referensi/brief-fork.md`); kerangka bersama (data,
  halaman yang dipakai banyak scene) ditulis DULU oleh Anda.

### Fase 5 — Potong & percepat
Setelah semua scene benar di 1x, isi `scenes/potong.ts` (segmen `S(a,b,v)` per scene). Cek total dengan
`npx remotion compositions src/demo/index.ts --config=remotion.demo.config.ts` (kolom durasi `Demo`).

### Fase 6 — Verifikasi
1. `npx tsc --noEmit -p tsconfig.json`
2. Pratinjau murah: `REMOTION_FPS=30 npx remotion render src/demo/index.ts Demo out/preview.mp4 --config=remotion.demo.config.ts --crf=26 --scale=0.5 --concurrency=10 --gl=angle`
3. Lembar kontak: `python "$HOME/.claude/skills/demotion/skrip/lembar-kontak.py" out/preview.mp4 --tiap 5` lalu Read gambarnya.
4. Periksa: teks terpotong, caption menutupi tombol yang diklik, kursor meleset, angka tak konsisten, klaim tak benar,
   lompatan layout, momen kosong/terlalu lama.

### Fase 7 — Render akhir & kirim
```powershell
powershell -File "$HOME/.claude/skills/demotion/skrip/bersihkan-proses.ps1"   # WAJIB bila ada render lama (tambah -JanganStudio bila user sedang memakai Studio)
```
```bash
cd <repo>/video && REMOTION_FPS=60 npx remotion render src/demo/index.ts Demo out/demo.mp4 --config=remotion.demo.config.ts --codec=h264 --crf=17 --concurrency=10 --gl=angle
```
Jalankan di latar belakang (`run_in_background`), tanpa `timeout` kecil. Perkiraan: ±12-18 frame/detik (GPU), 2 menit
60 fps = 7.000 frame ≈ 8 menit. Selesai → cek `ffprobe` (durasi, 1920x1080, 60 fps) + satu frame, lalu
`node ".../skrip/kompres.mjs" out/demo.mp4 out/demo-ringan.mp4 --crf 24` bila >30 MB dan kirim dengan `SendUserFile`
(batas 30 MB; file penuh tetap di disk, beri tahu user).

### Memperbarui demo yang sudah ada
`git diff`/`git log` untuk melihat halaman/teks yang berubah → perbarui hanya scene & `pages/*` terkait (salin ulang
markup dari kode), cek klaim caption lagi, sesuaikan `potong.ts`, verifikasi still scene itu, render ulang penuh.

## Jebakan yang pernah terjadi (baca `referensi/jebakan.md` sebelum mulai)
`React is not defined` (JSX di tingkat modul) · cache lintas-frame membuat kursor melompat · proses render yatim
menghabiskan CPU · blur/backdrop-filter membuat render 3x lambat · breakpoint Tailwind memakai lebar jendela headless ·
`sticky` mati di konten yang digeser · render paralel + berkas setengah jadi merusak bundle · ffmpeg Remotion tak punya
filter `fps`/`tile` · klaim fitur yang salah ketahuan user.

## Referensi dalam skill ini
- `referensi/arsitektur.md` — API engine (Stage, langkah kursor/gulir/kamera/sorotan, peta waktu, kit)
- `referensi/jebakan.md` — daftar jebakan + solusi
- `referensi/storyboard.md` — cara menyusun scene, caption, tempo, daftar riset
- `referensi/brief-fork.md` — templat brief untuk menulis scene paralel dengan subagent fork
- `referensi/render.md` — perintah render, kecepatan, GPU, kompres, kirim
- `templat/` — kode yang disalin scaffold · `skrip/` — scaffold, bersihkan-proses, lembar-kontak, kompres
- Contoh nyata 13 scene (landing + scroll, tur sorotan + dialog, ponsel scan QR, layar terbagi dashboard + ponsel, pindah
  halaman + pembayaran) berasal dari proyek ChatGerCep milik penulis; polanya ada di `templat/src/scenes/contoh.tsx` dan
  `referensi/arsitektur.md`.
