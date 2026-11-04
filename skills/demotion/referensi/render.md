# Render, kecepatan, kompres, kirim

Semua perintah dijalankan dari folder proyek video (`<repo>/video`).

## Pratinjau cepat (tiap iterasi)

```bash
# satu momen
REMOTION_FPS=30 npx remotion still src/demo/index.ts S-<scene> out/<scene>-<frame>.png --frame=<detik*30> --config=remotion.demo.config.ts
# seluruh video, murah (30 fps, setengah resolusi)
REMOTION_FPS=30 npx remotion render src/demo/index.ts Demo out/preview.mp4 --config=remotion.demo.config.ts --crf=26 --scale=0.5 --concurrency=10 --gl=angle
python "$HOME/.claude/skills/demotion/skrip/lembar-kontak.py" out/preview.mp4 --tiap 5     # lalu Read out/sheet1.png ...
```
Frame = detik*FPS (30 pada pratinjau). `S-<scene>` memakai peta potong yang sama dengan `Demo`, jadi waktu di still adalah
waktu VIDEO scene itu, bukan waktu asli. Untuk melihat waktu asli tertentu sementara kosongkan entri scene di `potong.ts`.

## Render akhir

```powershell
powershell -File "$HOME/.claude/skills/demotion/skrip/bersihkan-proses.ps1"
```
```bash
REMOTION_FPS=60 npx remotion render src/demo/index.ts Demo out/demo.mp4 --config=remotion.demo.config.ts --codec=h264 --crf=17 --concurrency=10 --gl=angle > out/render.log 2>&1
```
- `run_in_background` tanpa `timeout`. Progres: `tr '\r' '\n' < out/render.log | grep Rendered | tail -1`.
- `--gl=angle` memakai GPU (≈1,5x lebih cepat, kualitas sama). CPU 12 inti: `--concurrency=10`. RAM bebas ≥4 GB.
- Perkiraan: 60 fps ≈ 12-18 frame/dtk. 2 menit = 7.000 frame ≈ 8 menit.
- Ubah scene → bundel dibangun ulang otomatis; jangan ada render lain berjalan bersamaan.

## Cek hasil

```bash
npx remotion ffprobe out/demo.mp4 2>&1 | grep -E "Duration|Stream #0:0"      # 1920x1080, 60 fps, durasi
npx remotion ffmpeg -y -ss 69.6 -i out/demo.mp4 -frames:v 1 -vf scale=1280:-1 out/cek.png   # satu frame, lalu Read
```

## Kompres & kirim

`SendUserFile` maksimum 30 MB. File penuh (60-70 MB untuk 2 menit) tetap di disk.
```bash
node "$HOME/.claude/skills/demotion/skrip/kompres.mjs" out/demo.mp4 out/demo-ringan.mp4 --crf 24   # ≈26 MB / 2 menit
```
Kirim salinan ringan dengan `SendUserFile`; sebutkan lokasi file penuh dan bahwa ia melewati batas kirim.

## Studio (melihat/memutar di browser)

```bash
npx remotion studio src/demo/index.ts --config=remotion.demo.config.ts --port=3100 --no-open
```
Komposisi `Demo` (utuh) dan `S-<scene>` (per scene). Pemutaran bisa patah selama render berjalan (CPU sibuk).

## Pengiriman ke format lain

- GIF/WebM: `npx remotion render ... --codec=gif|vp9`; untuk media sosial 9:16 buat komposisi baru dengan ukuran lain.
- Suara/narasi: tambahkan `<Audio>` di Root (file di `public/`), sinkronkan dengan peta potong (waktu video, bukan asli).
