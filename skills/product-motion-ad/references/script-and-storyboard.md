# Naskah & storyboard

## Struktur iklan (30–45 detik, ±12 kalimat)

| # | Bagian | Durasi | Isi |
|---|---|---|---|
| 1 | Hook 3 ketukan | 5–7 dtk | hasil mengejutkan -> twist -> "Kok bisa?" |
| 2 | Perkenalan | 2–3 dtk | potongan keras ke warna aksen, logo jatuh, nama produk + tagline |
| 3..n | Flow produk | 2–4 dtk/langkah | satu langkah pemakaian = satu keunggulan + bukti UI, label "1 · Nama langkah" |
| n+1 | Bukti hasil | 2–3 dtk | grafik/angka naik, testimoni, before–after |
| n+2 | CTA | 2–3 dtk | logo + nama + tagline + tombol diklik tepat saat VO "coba sekarang" |

## Hook yang bikin orang tidak skip
- **Curiosity gap (paling berhasil)**: tunjukkan hasil yang tidak masuk akal, tahan jawabannya.
  "Eh, akun ini posting tiap hari... padahal yang punya lagi tidur. Kok bisa?"
  Pola: `[subjek] [hasil bagus] ... padahal [kondisi mustahil]. Kok bisa?`
- Alternatif: pertanyaan masalah ("Capek mikirin X tiap hari?"), angka mengejutkan ("3 jam kerja jadi 3 menit."), larangan ("Jangan X sebelum nonton ini.").
- Hindari perintah generik ("Stop scroll!") — terasa iklan dan cepat di-skip.
- Visual hook: kata muncul dari blur kata demi kata, bukti kecil (chip "Terbit 07.00") muncul, ketukan 3 = teks raksasa menghantam + getar kamera + SFX slam.
- Teks di layar HARUS sama dengan kata VO (kalau VO bilang "yang punya", layar jangan "pemiliknya").

## Aturan menulis VO
- ≤ 10 kata per kalimat, satu ide per kalimat, kata kerja aktif.
- Gaya ngobrol sesuai audiens (ID: "kamu", "terus", "dibalesin", "cobain deh"); hindari bahasa brosur ("memantau", "Anda" berulang).
- Mulai dengan kata pembuka ("Eh,", "Nah,") supaya kata kunci tidak jatuh di detik 0.
- Sebut nama produk 2× (perkenalan + CTA).
- Total kata ±75–90 untuk ±35 detik pada tempo cepat.
- Frasa pembuka tiap kalimat harus unik secara berurutan — dipakai sebagai `cue` di `DEFS`.

## Memetakan keunggulan -> scene
1. Dari sumber produk, susun tabel `Langkah | Aksi user | Keunggulan | Bukti visual`.
2. Gabungkan langkah kecil; buang yang tidak membedakan produk. Maks ±9 langkah.
3. Tiap langkah: pilih SATU bukti visual yang paling menjelaskan, mis.
   - login/daftar: tombol "Hubungkan akun" -> layar izin -> centang hijau "terhubung"
   - setup: form putih 3D, field terketik, chip pilihan menyala, tombol AI bersinar
   - proses AI/otomatis: radar/scan menangkap item, item lolos saringan menjadi kartu hasil
   - kualitas: checklist aturan tercentang + gauge skor + stempel "Lolos"
   - pilihan mode: dua kartu, sorotan & toggle pindah
   - hasil terbit/terkirim: kartu 3D berjajar, angka like/order naik
   - otomasi lanjutan: percakapan/notifikasi masuk, balasan otomatis, spam dicoret
   - pembelajaran/analitik: bar chart tumbuh + badge insight
4. Selang-seling latar: terang (blob) untuk pembuka/penutup & fitur sosial, gelap (grid titik + glow) untuk proses inti. Ganti gelap/terang maksimal 2–3 kali.

## Transisi (ritme referensi)
- `T = 10` frame; `push` (geser 480px + motion blur arah) untuk antar-langkah, `blurZoom` saat ganti mood/latar, `fade` untuk dua scene yang berbagi elemen (mis. chip radar -> chip saringan pada posisi sama), `none` = potongan keras (hook -> warna aksen).
- Latar global terus bergerak di bawah semua scene; transisi hanya menggerakkan konten.
