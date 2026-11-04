import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadSans } from "@remotion/google-fonts/PlusJakartaSans";
import { Easing } from "remotion";

/**
 * TOKEN BRAND — GANTI dengan token produk yang diiklankan.
 * Ambil dari CSS proyek (mis. globals.css / tailwind theme): warna aksen, teks, latar, font judul & isi.
 * Font: pakai @remotion/google-fonts/<NamaFont> yang sama dengan situs produk.
 */
export const DISPLAY = loadDisplay("normal", { weights: ["600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const SANS = loadSans("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;

export const BRAND = {
  name: "Nama Produk",
  first: "Nama", // bagian nama berwarna putih/tinta
  second: "Produk", // bagian nama bergradien
  tagline: "Satu kalimat: produk ini melakukan apa untuk siapa.",
  logo: "logo.png", // file di public/
};

export const C = {
  canvas: "#f4f5fb",
  ink: "#14172b",
  muted: "#5b6179",
  faint: "#a3a8bd",
  accent: "#3a4cf0",
  accentLight: "#7b8aff",
  accentSoft: "#eceefe",
  cyan: "#22b8e6", // warna kedua gradien
  cyanLight: "#4fd8ff",
  violet: "#8b5cf6", // warna blob ketiga
  pink: "#e879f9",
  dark: "#07080f",
  darkCard: "#141722",
  darkLine: "#252a3a",
  success: "#3dd6a0",
  danger: "#d6334a",
};

export const GRADIENT = `linear-gradient(100deg, ${C.accent} 10%, ${C.cyan} 90%)`;
export const GRADIENT_DARK = `linear-gradient(100deg, ${C.accentLight} 10%, ${C.cyanLight} 90%)`;

export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
