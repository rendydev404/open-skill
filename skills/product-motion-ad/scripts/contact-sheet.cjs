/**
 * Buat contact sheet (grid 5x3 per lembar) dari video untuk cek visual cepat.
 * Pakai ffmpeg bawaan Remotion (tidak perlu ffmpeg sistem) + sharp dari node_modules proyek.
 *
 *   node <skill>/scripts/contact-sheet.cjs <video.mp4> <outDir> [detik...]
 *   - tanpa daftar detik: 1 frame tiap 2 detik.
 *   - jalankan dari folder proyek Remotion (cwd) agar `npx remotion` & sharp ditemukan.
 * Hasil: <outDir>/sheet0.png, sheet1.png, ... -> buka dengan tool Read.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const sharp = require(require.resolve("sharp", { paths: [process.cwd()] }));

const [video, outDir, ...times] = process.argv.slice(2);
if (!video || !outDir) {
  console.error("usage: node contact-sheet.cjs <video> <outDir> [seconds...]");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const run = (args) => execFileSync(npx, ["remotion", ...args], { encoding: "utf8", shell: process.platform === "win32" });

let ts = times.map(Number);
if (!ts.length) {
  const dur = parseFloat(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).trim());
  for (let t = 0.5; t < dur; t += 2) ts.push(+t.toFixed(2));
}
const frames = ts.map((t, i) => {
  const f = path.join(outDir, `frame-${String(i).padStart(3, "0")}.png`);
  run(["ffmpeg", "-v", "error", "-y", "-ss", String(t), "-i", video, "-frames:v", "1", "-s", "340x192", f]);
  return f;
});
(async () => {
  for (let s = 0; s * 15 < frames.length; s++) {
    const chunk = frames.slice(s * 15, s * 15 + 15);
    const composite = chunk.map((f, i) => ({ input: f, left: (i % 5) * 344, top: Math.floor(i / 5) * 196 }));
    const out = path.join(outDir, `sheet${s}.png`);
    await sharp({ create: { width: 5 * 344, height: 3 * 196, channels: 3, background: "#ff00ff" } }).composite(composite).png().toFile(out);
    console.log(out, "->", chunk.map((_, i) => ts[s * 15 + i] + "s").join(" "));
  }
})();
