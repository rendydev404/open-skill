/**
 * Theme system. Give makeTheme() 1–4 base colors; every other token is derived so contrast stays sane.
 *   paper     background ("kertas")
 *   ink       main text / dark cards
 *   accent    highlighter, spark dot, live states (lime in the reference look)
 *   secondary second brand color, used for color-block moments and the accent word in the logo
 */

export type Theme = {
  paper: string;
  card: string;
  line: string;
  ink: string;
  inkSoft: string;
  muted: string;
  faint: string;
  accent: string;
  accentDeep: string;
  accentInk: string;
  secondary: string;
  secondaryInk: string;
  danger: string;
  isDark: boolean;
};

export type ThemeInput = { paper?: string; ink?: string; accent: string; secondary?: string; danger?: string };

const hex = (h: string) => {
  const s = h.replace("#", "");
  const n = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
/** Mix a toward b by t (0..1). */
export const mix = (a: string, b: string, t: number) => {
  const x = hex(a);
  const y = hex(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
export const luminance = (h: string) => {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const rgba = (h: string, a: number) => {
  const [r, g, b] = hex(h);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
const readableOn = (bg: string, light: string, dark: string) => (luminance(bg) > 0.4 ? dark : light);

export function makeTheme(input: ThemeInput): Theme {
  const paper = input.paper ?? "#f1eee7";
  const ink = input.ink ?? "#111214";
  const isDark = luminance(paper) < 0.25;
  const secondary = input.secondary ?? mix(input.accent, ink, 0.55);
  const lightText = isDark ? ink : paper;
  const darkText = isDark ? paper : ink;
  return {
    paper,
    card: isDark ? mix(paper, ink, 0.06) : mix(paper, "#ffffff", 0.55),
    line: mix(paper, ink, isDark ? 0.16 : 0.12),
    ink,
    inkSoft: mix(ink, paper, 0.1),
    muted: mix(ink, paper, 0.55),
    faint: mix(ink, paper, 0.68),
    accent: input.accent,
    accentDeep: mix(input.accent, ink, isDark ? 0.0 : 0.22),
    accentInk: readableOn(input.accent, lightText, darkText),
    secondary,
    secondaryInk: readableOn(secondary, lightText, darkText),
    danger: input.danger ?? "#c8443a",
    isDark,
  };
}

/** Ready-made palettes. "lime" is the original editorial reference look. */
export const presets = {
  lime: { paper: "#f1eee7", ink: "#111214", accent: "#d6f04a", secondary: "#3a4cf0" },
  coral: { paper: "#f5efe6", ink: "#16120f", accent: "#ff6b4a", secondary: "#1f3dff" },
  ocean: { paper: "#edf2f3", ink: "#0d1b2a", accent: "#5ce1c6", secondary: "#2b59ff" },
  sunset: { paper: "#fbf3ea", ink: "#1d1410", accent: "#ffb020", secondary: "#e5484d" },
  violet: { paper: "#f3f0f7", ink: "#15111c", accent: "#c4f25a", secondary: "#7c3aed" },
  night: { paper: "#0f1012", ink: "#f1eee7", accent: "#d6f04a", secondary: "#8b7bff" },
} satisfies Record<string, ThemeInput>;
