# Menyusun storyboard demo

## Yang dibaca dari kode (urutan prioritas)

1. **Teks tur/onboarding & hint UI** — sudah ditulis untuk pengguna awam: sumber caption terbaik.
2. **Rute & halaman** (`app/**/page.tsx`): urutan perjalanan pengguna, state kosong vs berisi.
3. **Paket/harga/kuota/trial** (seed DB, konstanta, definisi paket), metode bayar, batas waktu, aturan komisi.
4. **Default & batas** (serah-terima, kuota, ukuran berkas, retensi data, rate limit).
5. **Komponen** yang akan disalin: kelas Tailwind persis, ikon (lucide), warna token.
6. **Aturan bisnis yang mudah salah klaim**: siapa dikenai kuota, mesin/model bawaan, fitur khusus admin.

## Perjalanan standar (sesuaikan)

| # | Scene | Tujuan penonton paham | Durasi asli → video |
|---|---|---|---|
| 0 | Intro | nama + janji produk + peta perjalanan | 6 → 3,5 |
| 1 | Landing | masalah, fitur, cara kerja, harga | 33 → 13 |
| 2 | Daftar | mulai tanpa friksi (gratis/trial) | 18 → 7,5 |
| 3 | Onboarding/tur | tata letak, langkah pertama | 35 → 9 |
| 4-7 | Setup inti | sambungkan, isi data/knowledge, uji, atur | 30-40 → 10-12 tiap scene |
| 8 | Momen "wow" | hasil nyata (mis. layar terbagi dashboard + ponsel) | 42 → 13 |
| 9 | Pantau | statistik (data contoh) | 14 → 5,5 |
| 10 | Bayar/langganan | paket, metode, aktif otomatis | 40 → 10 |
| 11 | Program tambahan | afiliasi/integrasi bila ada | 29 → 8,5 |
| 12 | Outro | rekap manfaat + CTA + kontak demo | 10 → 4,5 |

Total video 1-2 menit. Bila produk lebih kecil, gabungkan/hapus scene; jangan memanjangkan.

## Aturan caption

- Bentuk: **judul** (≤ 60 karakter, kalimat berita) + **sub** (≤ 110 karakter, detail/aturan). Label bab `N · NAMA`.
- Isi caption = product knowledge: apa itu, kenapa, aturan/batas, default, apa yang terjadi berikutnya.
- Tampil ≥ 2,5 dtk pada kecepatan 1x; di segmen dipercepat (>3x) caption otomatis hilang, jadi taruh pesan penting di
  segmen 1-2x.
- Satu caption pada satu waktu; jeda 0,2-0,3 dtk antar caption. Jangan menutupi elemen yang sedang diklik.
- Bahasa Indonesia ringkas, hindari jargon teknis. Angka/harga persis dari kode.

## Tempo & gerak

- Kursor tiba di target 0,4-1 dtk setelah berangkat; jeda 0,3-0,6 dtk sebelum klik; klik → UI berubah ±0,1 dtk.
- Zoom (1,25-1,5x) hanya saat detail kecil perlu dibaca atau ada momen penting; kembali ke 1x sebelum pindah topik.
- Pengetikan 12-45 karakter/dtk (cepat untuk teks panjang, dipercepat lagi lewat peta waktu).
- Beri 1-1,5 dtk diam setelah hasil muncul (supaya terbaca) sebelum berpindah.
- Perpindahan halaman dalam satu scene: ganti isi berdasarkan waktu + reset gulir; kursor tetap di tempatnya.

## Data demo

- Satu tokoh/usaha fiktif + nomor/email/rekening placeholder, dipakai di semua scene (`data.ts`).
- Teks panjang (knowledge, pesan chat) ditulis sekali di `data.ts`; panjang karakter dihitung (`.length`).
- Statistik "hari-hari berjalan" = data contoh dengan caption yang menyebutnya.
- Jangan menaruh data pelanggan/produksi nyata.

## Catatan verifikasi klaim (isi sebelum menulis caption)

```
klaim: "Uji bot gratis, tidak memakai kuota"   sumber: src/app/api/uji/route.ts (tidak memanggil catatPakai) ✓
klaim: "Serah-terima default 5 detik"          sumber: (arahan user) — tampilkan nilai itu di scene pengaturan
```
