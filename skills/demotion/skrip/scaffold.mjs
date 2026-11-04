#!/usr/bin/env node
/**
 * Scaffold proyek video demo (Remotion) ke sebuah folder.
 *
 *   node scaffold.mjs --dest <folder-video> --nama "NamaProduk" --domain contoh.com --aksen "#3ddc97" [--install]
 *
 * - Menyalin templat/src  -> <dest>/src/demo        (engine + kerangka scene; TIDAK menimpa berkas yang sudah ada)
 * - Membuat <dest>/remotion.demo.config.ts, tsconfig.json (bila belum ada), .gitignore
 * - Menggabungkan dependensi & skrip ke <dest>/package.json (membuatnya bila belum ada)
 * - Mengisi BRAND di src/demo/config.ts
 * Tidak memakai paket apa pun (hanya Node bawaan).
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLAT = join(SKILL, "templat");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith("--") ? [...a, [x.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]] : a), []),
);
const dest = resolve(args.dest || "video");
const nama = args.nama || "NamaProduk";
const domain = args.domain || "contoh.com";
const aksen = args.aksen || "#3ddc97";
const REMOTION = args.remotion || "4.0.535";

mkdirSync(dest, { recursive: true });

/** Salin pohon berkas tanpa menimpa yang sudah ada; kembalikan daftar yang baru dibuat. */
function salin(dari, ke, baru = []) {
  for (const f of readdirSync(dari)) {
    const a = join(dari, f);
    const b = join(ke, f);
    if (statSync(a).isDirectory()) {
      mkdirSync(b, { recursive: true });
      salin(a, b, baru);
    } else if (!existsSync(b)) {
      cpSync(a, b);
      baru.push(relative(dest, b));
    }
  }
  return baru;
}

const demo = join(dest, "src", "demo");
mkdirSync(demo, { recursive: true });
const baru = salin(join(TEMPLAT, "src"), demo);

// BRAND
const cfg = join(demo, "config.ts");
let c = readFileSync(cfg, "utf8");
c = c.replace("__NAMA__", nama).replace("__DOMAIN__", domain).replace("__AKSEN__", aksen);
writeFileSync(cfg, c);

// Berkas akar
for (const [f, isi] of [
  ["remotion.demo.config.ts", readFileSync(join(TEMPLAT, "remotion.demo.config.ts"), "utf8")],
  ["tsconfig.json", readFileSync(join(TEMPLAT, "tsconfig.json"), "utf8")],
]) {
  const p = join(dest, f);
  if (!existsSync(p)) {
    writeFileSync(p, isi);
    baru.push(f);
  }
}
const gi = join(dest, ".gitignore");
const giIsi = existsSync(gi) ? readFileSync(gi, "utf8") : "";
const tambah = ["node_modules", "out", ".cache"].filter((x) => !giIsi.split(/\r?\n/).includes(x));
if (tambah.length) writeFileSync(gi, giIsi + (giIsi && !giIsi.endsWith("\n") ? "\n" : "") + tambah.join("\n") + "\n");

// package.json
const pj = join(dest, "package.json");
const pkg = existsSync(pj) ? JSON.parse(readFileSync(pj, "utf8")) : { name: "video-demo", private: true, version: "0.0.0" };
pkg.scripts = {
  ...(pkg.scripts ?? {}),
  "demo:studio": "remotion studio src/demo/index.ts --config=remotion.demo.config.ts",
  "demo:render": "remotion render src/demo/index.ts Demo out/demo.mp4 --config=remotion.demo.config.ts --codec=h264 --crf=17 --gl=angle",
};
const dep = pkg.dependencies ?? {};
const dev = pkg.devDependencies ?? {};
const ada = (n) => dep[n] ?? dev[n];
const tambahDep = {
  remotion: REMOTION,
  "@remotion/cli": REMOTION,
  "@remotion/tailwind-v4": REMOTION,
  react: "^19",
  "react-dom": "^19",
  tailwindcss: "^4",
  "lucide-react": ">=0.468.0",
  "@fontsource/inter": "^5",
};
for (const [n, v] of Object.entries(tambahDep)) if (!ada(n)) dep[n] = v;
for (const [n, v] of Object.entries({ typescript: "^5", "@types/react": "^19", "@types/node": "^22" })) if (!ada(n)) dev[n] = v;
pkg.dependencies = dep;
pkg.devDependencies = dev;
writeFileSync(pj, JSON.stringify(pkg, null, 2) + "\n");

console.log(`\nScaffold selesai di ${dest}\nBerkas baru:\n${baru.map((x) => "  + " + x).join("\n") || "  (tidak ada: sudah lengkap)"}`);

if (args.install) {
  console.log("\nnpm install ...");
  const r = spawnSync("npm install", { cwd: dest, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(`
Langkah berikut:
  1. (jika belum) cd "${dest}" && npm install
  2. Salin token warna & komponen CSS aplikasi ke src/demo/index.css; ganti font di src/demo/fonts.ts
  3. Tulis scene di src/demo/scenes/*.tsx lalu daftarkan di src/demo/scenes/index.ts
  4. Uji: REMOTION_FPS=30 npx remotion still src/demo/index.ts S-contoh out/uji.png --frame=60 --config=remotion.demo.config.ts
`);
