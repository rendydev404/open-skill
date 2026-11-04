#!/usr/bin/env python
"""
Buat "lembar kontak" dari sebuah video: satu gambar berisi cuplikan tiap N detik (dengan label waktu), supaya seluruh
video bisa diperiksa dalam beberapa gambar. ffmpeg bawaan Remotion TIDAK punya filter `fps`/`tile`, jadi frame diambil
satu per satu dengan -ss lalu disusun dengan Pillow.

  python lembar-kontak.py <video.mp4> [--tiap 5] [--kolom 3] [--baris 4] [--lebar 640] [--keluar out/sheet]
Dijalankan dari folder proyek video (tempat `npx remotion ffmpeg` / `npx remotion ffprobe` tersedia).
Hasil: <keluar>1.png, <keluar>2.png, ...
"""
import argparse
import os
import re
import subprocess
import tempfile

from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--tiap", type=float, default=5)
ap.add_argument("--kolom", type=int, default=3)
ap.add_argument("--baris", type=int, default=4)
ap.add_argument("--lebar", type=int, default=640)
ap.add_argument("--keluar", default="out/sheet")
a = ap.parse_args()

NPX = "npx.cmd" if os.name == "nt" else "npx"


def jalan(*arg):
    return subprocess.run([NPX, "remotion", *arg], capture_output=True, text=True)


durasi = None
m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", jalan("ffprobe", a.video).stdout + jalan("ffprobe", a.video).stderr)
if m:
    durasi = int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3])
if not durasi:
    raise SystemExit("durasi video tidak terbaca")

waktu = []
t = a.tiap / 2
while t < durasi:
    waktu.append(t)
    t += a.tiap

tmp = tempfile.mkdtemp()
file = []
for i, t in enumerate(waktu):
    f = os.path.join(tmp, f"f{i:03d}.png")
    jalan("ffmpeg", "-y", "-ss", f"{t:.2f}", "-i", a.video, "-frames:v", "1", "-vf", f"scale={a.lebar}:-1", f)
    if os.path.exists(f):
        file.append((t, f))

per = a.kolom * a.baris
os.makedirs(os.path.dirname(a.keluar) or ".", exist_ok=True)
H = round(a.lebar * 9 / 16)
for n in range(0, len(file), per):
    bagian = file[n : n + per]
    im = Image.new("RGB", (a.lebar * a.kolom, H * a.baris), (10, 10, 10))
    d = ImageDraw.Draw(im)
    for k, (t, f) in enumerate(bagian):
        x, y = (k % a.kolom) * a.lebar, (k // a.kolom) * H
        im.paste(Image.open(f).convert("RGB").resize((a.lebar, H)), (x, y))
        d.rectangle([x + 4, y + 4, x + 64, y + 26], fill=(0, 0, 0))
        d.text((x + 10, y + 9), f"{int(t)}s", fill=(61, 220, 151))
    nama = f"{a.keluar}{n // per + 1}.png"
    im.save(nama)
    print(nama)
