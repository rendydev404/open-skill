---
name: product-motion-ad
description: Buat video iklan motion graphic untuk produk apa pun (SaaS, app, produk digital, fisik) dengan Remotion + voice over & sound effect ElevenLabs. Alur iklan mengikuti flow pemakaian produk dan setiap scene membuktikan satu keunggulan. Pakai saat user minta "buat motion graphic / video iklan / promo / explainer produk", memberi video referensi gaya transisi, atau minta VO/SFX untuk video produk.
---

# Product Motion Ad (Remotion + ElevenLabs)

Hasil akhir: MP4 1920×1080 30 fps, 30–45 detik, hook kuat, VO bahasa target yang terdengar manusia,
SFX profesional, transisi cepat ala referensi, dan alur = flow produk asli. Dikirim ke user dengan `SendUserFile`.

Template teruji ada di `template/` (folder skill ini). Contoh lengkap 13 scene dari proyek nyata ada di
`references/example-scenes-threads-automation.tsx.txt` dan `references/example-promo-threads-automation.tsx.txt`.
Baca `references/script-and-storyboard.md` sebelum menulis naskah dan `references/elevenlabs.md` sebelum membuat audio.

## Prinsip yang tidak boleh dilanggar

1. **Produk harus jelas dalam 8 detik pertama**: nama produk + "melakukan apa untuk siapa".
2. **Urutan scene = urutan flow pemakaian produk** (daftar/login -> setup -> proses inti -> hasil -> fitur lanjutan -> bukti hasil -> CTA). Jangan acak.
3. **Satu kalimat VO = satu scene = satu keunggulan + bukti visualnya** (UI yang bergerak: form terisi, tombol diklik, kartu hasil muncul, angka naik). Jangan hanya teks.
4. **Fakta dari sumber produk**, bukan karangan: baca kode/landing/onboarding/halaman "cara kerja". Angka contoh (views, skor) boleh ilustrasi, tapi sebutkan ke user bahwa itu ilustrasi.
5. **Tempo cepat seperti referensi**: transisi 10 frame (`T = 10`), animasi di dalam scene dipercepat `speed` 1.5–3. Jangan memperlambat scene untuk mengisi VO yang lambat — perbaiki VO-nya.
6. **VO manusiawi**: satu take utuh, gaya ngobrol, tempo cepat, tanpa tag emosi di tiap baris. Bukan per-kalimat terpisah (itu yang membuat kaku).
7. Ikuti aturan performa user: satu kali ukur awal & akhir, jangan render berulang tanpa alasan.

## Alur kerja

### 1. Kumpulkan bahan (paralel bila bisa)
- **Produk**: di repo, cari teks landing, onboarding, halaman cara kerja/fitur, nama fitur di UI (Grep string UI). Di luar repo: minta deskripsi/URL. Tulis tabel **flow keunggulan**:
  `Langkah | Aksi user | Keunggulan | Bukti visual (UI yang ditampilkan)`.
- **Brand**: warna & font dari CSS (`globals.css`, tema Tailwind, CSS landing), logo dari `public/`. Isi `template/src/theme.ts` (`C`, `GRADIENT`, font, `BRAND`).
- **Referensi gaya** (bila ada video): ekstrak frame dengan ffmpeg bawaan Remotion lalu lihat contact sheet:
  `npx remotion ffmpeg -v error -i "<video>" -r 3 -s 340x192 <dir>/f%03d.png` (filter `fps=`/`tile` TIDAK tersedia di ffmpeg Remotion; gunakan `-r` dan `scripts/contact-sheet.cjs`).
  Catat: latar (blob buram/grid titik), cara teks muncul, potongan keras, UI 3D, kursor klik, glow, ritme.

### 2. Naskah & storyboard
Ikuti `references/script-and-storyboard.md`: hook 3 ketukan (curiosity gap), 1 baris ≤ 10 kata per scene,
gaya ngobrol, kalimat pertama diawali kata pembuka ("Eh,") agar kata kunci tidak salah ucap di detik 0, CTA pendek.
Tunjukkan naskah + urutan scene singkat ke user hanya bila brief-nya ambigu; selain itu langsung kerjakan.

### 3. Proyek Remotion
- Salin `template/` ke folder baru di repo user (mis. `promo-video/`), `npm install`.
- Bila di dalam repo Next.js/TS lain: tambahkan folder itu ke `exclude` di `tsconfig.json` root dan ke `globalIgnores` ESLint. Folder sudah punya `.gitignore` (node_modules, out).
- Salin logo ke `promo-video/public/` dan set `BRAND.logo`.
- Tulis scene per produk di `src/scenes.tsx` (pakai pola di contoh: `useFrame()`, `useRise/rise`, `glass/white`, `StepTag`, `Words`, `typed+Caret`, `Cursor`, `BlurFilter`). Scene generik `makeFeature` hanya untuk prototipe.
- Isi `DEFS` di `src/Promo.tsx`: urutan scene, `cue` (frasa pembuka kalimat VO), `beats` (hook), `speed`, transisi, `dark`, `sfx`.

### 4. Audio ElevenLabs (lihat `references/elevenlabs.md`)
- VO satu take -> `public/vo/full.mp3`; transkrip Scribe per kata -> `public/vo/words.json`. **Periksa transkripnya** (kata salah ucap? baris hilang?).
- SFX pack 10 file -> `public/sfx/*.mp3`.
- Timeline otomatis: scene mulai 6 frame sebelum frasa `cue`-nya diucapkan; SFX diletakkan di waktu desain scene (dibagi `speed`).

### 5. Render & verifikasi
- `npm run typecheck` lalu `npm run render` (port 3456 — port 3000 sering dipakai dev server Next, render akan gagal "not a valid Remotion project").
- Jalankan render di background bila > 2 menit.
- Cek visual: `node <skill>/scripts/contact-sheet.cjs out/promo.mp4 <scratchpad>/chk` lalu Read sheet-nya. Untuk detik tertentu beri daftar detik. (Sampel `-r` ffmpeg sering menampilkan frame awal kosong palsu — cek detik spesifik bila ragu.)
- Periksa: teks tidak blur menetap, tidak terpotong/terbungkus, label langkah tidak tertutup panel, animasi kunci selesai sebelum scene berganti, teks layar = kata VO.
- Kirim dengan `SendUserFile` (display `render`), laporkan durasi, ukuran, dan apa yang belum diverifikasi (mis. level audio tidak didengar langsung).

## Jebakan yang sudah terjadi (hindari)

| Masalah | Penyebab | Solusi |
|---|---|---|
| Teks hook blur terus | nilai blur fase sebelumnya (`out1`) tetap 1 | hitung blur per fase: masuk/keluar saja |
| Video jadi lambat | scene diregangkan mengikuti VO lambat | VO lebih cepat & naskah lebih pendek; `speed` tetap |
| VO kaku | klip per kalimat + tag `[excited]` tiap baris + bahasa baku | satu take, gaya ngobrol, tanpa tag berulang |
| Kata pertama salah ucap ("akun"->"kurun") | v3 sering meleset di kata pertama | awali dengan "Eh," / "Nah," dan cek transkrip Scribe |
| Render gagal "getStaticCompositions undefined" | port 3000 dipakai Next dev | `--port=3456` |
| `fps=`/`tile` error | ffmpeg Remotion terbatas | `-r` + `contact-sheet.cjs` (sharp) |
| Kalimat terbungkus 2 baris & avatar terpotong | flex item menyusut | `flexWrap: "nowrap"`, kecilkan font |
| Panel menutupi label langkah | translateY kamera terlalu besar | batasi gerak kamera, `scale(0.92)` |
| Chip/kartu bertabrakan | posisi polar berdekatan | cek contact sheet, geser sudut/radius |
| `useId()` di url(#id) rusak | id berisi `:` | `useFilterId()` (sanitasi) |
| MCP ElevenLabs tidak termuat setelah login | tool baru muncul di sesi baru | pakai tool langsung bila ada; kalau tidak, `claude -p` headless (lihat referensi) |
| MCP gagal "Protected resource ... does not match" | host region | `claude mcp add -s user --transport http elevenlabs https://api.us.elevenlabs.io/v1/mcp` |
