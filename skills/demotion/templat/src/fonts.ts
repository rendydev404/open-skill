/**
 * Font produk. Ganti dengan font yang DIPAKAI aplikasi (lihat next/font atau @font-face di proyek) lewat paket
 * @fontsource/<nama>. Setiap bobot yang dipakai UI harus dimuat di sini dan di FONT_FACES.
 */
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

/** Argumen document.fonts.load(): render menunggu semuanya siap supaya teks tidak berganti font di tengah video. */
export const FONT_FACES = ['400 16px "Inter"', '500 16px "Inter"', '600 16px "Inter"', '700 16px "Inter"'];
