// Contact sheets for reviewing a render: node scripts/frames.mjs <video.mp4> <outDir> [stepSeconds=1.5]
// Uses Remotion's bundled ffmpeg (its build lacks the fps/tile filters, so frames are grabbed one by one with -ss)
// and sharp to tile them 4 per row, 12 per sheet, each labeled with its timestamp.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [video, outDir, stepArg] = process.argv.slice(2);
if (!video || !outDir) {
  console.error("usage: node scripts/frames.mjs <video.mp4> <outDir> [stepSeconds]");
  process.exit(1);
}
const step = Number(stepArg ?? 1.5);
fs.mkdirSync(outDir, { recursive: true });
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const probe = spawnSync(npx, ["remotion", "ffprobe", video], { encoding: "utf8", shell: process.platform === "win32" });
const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe.stdout + probe.stderr);
const duration = m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
if (!duration) {
  console.error("could not read duration");
  process.exit(1);
}

const TW = 480;
const TH = 270;
const shots = [];
for (let t = 0.2; t < duration; t += step) {
  const file = path.join(outDir, `f_${t.toFixed(2)}.jpg`);
  spawnSync(npx, ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-ss", t.toFixed(3), "-i", video, "-frames:v", "1", "-vf", `scale=${TW}:${TH}`, file], { shell: process.platform === "win32" });
  if (fs.existsSync(file)) shots.push({ t, file });
}

for (let s = 0; s * 12 < shots.length; s++) {
  const chunk = shots.slice(s * 12, s * 12 + 12);
  const comps = [];
  for (let i = 0; i < chunk.length; i++) {
    const label = Buffer.from(`<svg width="96" height="28"><rect width="96" height="28" fill="black" opacity="0.7"/><text x="8" y="20" font-size="18" fill="#ff0" font-family="monospace">${chunk[i].t.toFixed(1)}s</text></svg>`);
    const img = await sharp(chunk[i].file).composite([{ input: label, left: 0, top: 0 }]).toBuffer();
    comps.push({ input: img, left: (i % 4) * TW, top: Math.floor(i / 4) * TH });
  }
  const rows = Math.ceil(chunk.length / 4);
  await sharp({ create: { width: 4 * TW, height: rows * TH, channels: 3, background: "#000" } }).composite(comps).jpeg({ quality: 82 }).toFile(path.join(outDir, `sheet${s + 1}.jpg`));
}
shots.forEach((x) => fs.unlinkSync(x.file));
console.log(`duration ${duration.toFixed(2)}s, ${shots.length} frames, ${Math.ceil(shots.length / 12)} sheet(s) in ${outDir}`);
