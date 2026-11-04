#!/usr/bin/env node
/**
 * Buat salinan ringan sebuah video (H.264, yuv420p, faststart) supaya muat dikirim lewat SendUserFile (batas 30 MB).
 *
 *   node kompres.mjs <masuk.mp4> [keluar.mp4] [--crf 24]
 * Dijalankan dari folder proyek video (memakai `npx remotion ffmpeg`). Naikkan --crf (27, 30) bila masih > 30 MB.
 */
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";

const arg = process.argv.slice(2);
const crfI = arg.indexOf("--crf");
const crf = crfI >= 0 ? arg[crfI + 1] : "24";
const pos = arg.filter((x, i) => !x.startsWith("--") && i !== crfI + 1);
const masuk = pos[0];
if (!masuk) {
  console.error("pemakaian: node kompres.mjs <masuk.mp4> [keluar.mp4] [--crf 24]");
  process.exit(1);
}
const keluar = pos[1] ?? masuk.replace(/\.mp4$/i, `-ringan.mp4`);
const q = (x) => `"${x.replace(/"/g, '\\"')}"`;
const r = spawnSync(`npx remotion ffmpeg -y -i ${q(masuk)} -c:v libx264 -preset slow -crf ${crf} -pix_fmt yuv420p -movflags +faststart ${q(keluar)}`, { stdio: "ignore", shell: true });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`${keluar}  ${(statSync(keluar).size / 1048576).toFixed(1)} MB (crf ${crf})`);
