import { type Seg } from "../kit/timemap";
// import { S } from "../kit/timemap";   // S(a, b, v) = detik ASLI a..b diputar dengan kecepatan v

/**
 * Peta potong + percepat tiap scene (detik ASLI scene). Bagian yang tidak tercantum DILEWATI (potongan lompat, ada dip
 * singkat); v > 1 dipercepat. Caption otomatis disembunyikan bila setelah dipercepat tampil < 1,2 detik, jadi segmen
 * yang harus dibaca dibiarkan 1x-2x, sedangkan pengetikan/loading/perpindahan halaman dipercepat 3x-8x.
 * Scene yang tidak tercantum diputar 1x apa adanya. Contoh:
 *
 *   landing: [S(0.5, 4.7, 1.4), S(4.7, 9.8, 4), S(9.9, 13.0, 1.3), S(24.4, 26.5, 4)],
 *
 * Kerjakan SETELAH semua scene selesai dan terlihat benar di 1x; target total biasanya 1-2 menit.
 */
export const POTONG: Record<string, Seg[]> = {};
