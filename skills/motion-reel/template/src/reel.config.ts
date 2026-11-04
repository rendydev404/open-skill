import { makeTheme, presets } from "./theme";
import type { ReelConfig } from "./types";

/**
 * The only file you normally edit. Order of `scenes` = order in the video.
 * Colors: makeTheme(presets.lime) or makeTheme({ accent: "#ff6b4a", secondary: "#1f3dff", paper: "#f5efe6", ink: "#16120f" }).
 * Copy limits (so nothing overflows at 1920×1080) are listed in the skill's references/config.md.
 */
export const config: ReelConfig = {
  brand: { hudLabel: "BOTTHREADS / RADAR REEL '26", logo: null, initials: "BT" },
  theme: makeTheme(presets.lime),
  sfx: true,
  scenes: [
    { type: "spark", label: "01 — PINDAI", caption: "memindai 6 sumber tren — niche · threads · indonesia · akun · medsos · inspirasi" },
    {
      type: "word",
      label: "02 — SINYAL",
      word: "Viral",
      cards: [
        { icon: "TrendingUp", title: "Harga kopi naik lagi", meta: "NICHE · +18%" },
        { icon: "MessageCircle", title: "Promo gajian", meta: "THREADS · 12rb" },
        { icon: "Globe", title: "Harbolnas 11.11", meta: "#2 DI INDONESIA" },
        { icon: "Flame", title: "Tips foto produk", meta: "AKUN ANDA · 4,2×" },
        { icon: "Megaphone", title: "AI untuk UMKM", meta: "MEDSOS · 3 JAM" },
        { icon: "Lightbulb", title: "Cerita buka kedai", meta: "INSPIRASI SAYA" },
      ],
      counter: { label: "SINYAL MASUK", to: 146 },
    },
    { type: "tagline", label: "02 — SINYAL", sans: "Tangkap trennya,", serif: "sebelum keburu basi.", mark: "basi" },
    {
      type: "bento",
      label: "03 — SUMBER",
      kicker: "6 SUMBER · DIPERBARUI OTOMATIS",
      title: { sans: "Semua sumber tren,", serif: "satu radar.", mark: "radar" },
      feature: { icon: "TrendingUp", title: "Naik di niche Anda", meta: "RISET AI · TIAP 8 JAM", lines: ["> niche: kuliner · kopi", "> tren naik: harga susu +18%", "> topik baru: gelas kecil", "> riset ulang: tiap 8 jam"], footer: "KULINER // KOPI // @KEDAI.SENJA" },
      cards: [
        { icon: "MessageCircle", title: "Viral di Threads", meta: "POSTING PALING POPULER", viz: "dots" },
        { icon: "Globe", title: "Ramai di Indonesia", meta: "DISARING AMAN BRAND", viz: "chips", chips: ["#1 Harbolnas", "#2 Gajian", "#3 Kopi susu"] },
        { icon: "Flame", title: "Viral di akun Anda", meta: "VIEWS DI ATAS BIASA", viz: "bars", value: "4,2×" },
        { icon: "Megaphone", title: "Viral di medsos", meta: "OBROLAN & MEME", viz: "clock", value: "tiap 3 jam" },
      ],
      wide: { icon: "Lightbulb", title: "Inspirasi saya", meta: "TEKS YANG ANDA SIMPAN", quote: "Cerita hari pertama buka kedai, jujur saja." },
    },
    {
      type: "checklist",
      label: "04 — SARING",
      kicker: "BRAND-SAFE · OTOMATIS",
      title: { sans: "Disaring dulu,", serif: "baru dipakai.", mark: "dipakai" },
      items: [
        { text: "Promo gajian akhir bulan", ok: true },
        { text: "Gosip perceraian artis", ok: false, reason: "GOSIP PRIBADI" },
        { text: "Harga kopi susu naik", ok: true },
        { text: "Debat politik memanas", ok: false, reason: "ISU SENSITIF" },
        { text: "Tips foto produk pakai HP", ok: true },
        { text: "Hoaks kesehatan viral", ok: false, reason: "INFO PALSU" },
      ],
      okBadge: "AMAN",
      noBadge: "DITOLAK",
      summaryLabel: "LOLOS BRAND-SAFE",
    },
    {
      type: "steps",
      label: "05 — AGEN AI",
      kicker: "AGEN AI · @KEDAI.SENJA · BERJALAN OTOMATIS",
      title: { sans: "Ide ditulis AI,", serif: "untuk tiap akun.", mark: "akun" },
      steps: ["Baca postingan", "Baca Profil AI", "Riset niche", "Susun ide", "Siapkan posting"],
      results: ["Harga kopi naik, kedai kecil bertahan", "3 salah kaprah soal kopi susu", "Hari pertama buka kedai"],
      resultMeta: "IDE",
    },
    {
      type: "formula",
      label: "06 — SKOR",
      kicker: "RINCIAN TERBUKA · 0–100",
      title: { sans: "Skor dihitung,", serif: "bukan ditebak.", mark: "ditebak" },
      metrics: [
        { label: "TREN", value: 92, hint: "viral trennya" },
        { label: "POTENSI VIRAL", value: 88, hint: "balasan & repost" },
        { label: "KEBARUAN", value: 81, hint: "beda dari kemarin" },
        { label: "KECOCOKAN", value: 90, hint: "cocok akun ini" },
        { label: "KINERJA", value: 76, hint: "pola serupa" },
      ],
      total: { label: "SKOR IDE", value: 87, suffix: "/100" },
      footnote: "makin tinggi skornya, makin cepat dipakai autopilot.",
    },
    {
      type: "showcase",
      label: "07 — PREVIEW",
      line1: "Lihat dulu,",
      line2: "lalu sematkan.",
      mark: "sematkan",
      body: "AI menulis dengan gaya akun Anda, lengkap dengan gambar.",
      card: { avatar: "KS", name: "kedai.senja", status: "PREVIEW · DRAF", text: "Jujur ya, minggu ini harga susu naik lagi dan saya hampir ikut naikin harga kopi.\n\nTapi saya pilih kecilin gelas, bukan naikin harga. Kalian lebih suka yang mana?", imageText: "gelas kecil, harga tetap." },
      action: { label: "Posting ide ini duluan", done: "Diposting duluan", badge: "DIPOSTING DULUAN" },
    },
    {
      type: "stats",
      label: "08 — ANGKA",
      items: [
        { value: 6, label: "SUMBER TREN DIPANTAU" },
        { value: "0–100", label: "SKOR UNTUK TIAP IDE" },
        { value: "3 jam", label: "SIKLUS RISET MEDSOS" },
      ],
    },
    {
      type: "kinetic",
      label: "09 — ALUR",
      words: [
        { text: "PINDAI.", sub: "tren dari 6 sumber" },
        { text: "SARING.", sub: "hanya yang aman untuk brand" },
        { text: "SKOR.", sub: "ide terbaik dipakai duluan" },
        { text: "TERBIT.", sub: "autopilot memposting otomatis" },
      ],
    },
    { type: "logo", label: "10 — RADAR", name: "BotThreads", accentWord: "Radar", tagline: "Konten selalu nyambung dengan yang lagi ramai.", mark: "ramai", cta: "Buka tab Radar di dashboard →" },
  ],
};
