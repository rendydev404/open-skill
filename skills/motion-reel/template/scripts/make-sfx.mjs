// Soft UI sound effects for motion-reel. Writes stereo WAVs into public/sfx/ (run: npm run sfx).
import fs from "node:fs";

const SR = 44100;
const OUT = process.argv[2] ?? "public/sfx";
fs.mkdirSync(OUT, { recursive: true });

let seed = 3;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 4294967296) * 2 - 1;
};

function write(name, L, R = L) {
  const n = L.length;
  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  // every file is normalized to the same peak; loudness is set per cue in the composition
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, (n - i) / (SR * 0.01));
    buf.writeInt16LE(Math.round((L[i] / peak) * 0.85 * fade * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round((R[i] / peak) * 0.85 * fade * 32767), 46 + i * 4);
  }
  fs.writeFileSync(`${OUT}/${name}.wav`, buf);
}
const buf = (sec) => [new Float32Array(Math.ceil(sec * SR)), new Float32Array(Math.ceil(sec * SR))];

/** Airy whoosh: band-passed noise whose band and level swell toward `peak` (0..1 of length). */
function whoosh(name, dur, peak, lo, hi, tone = 0) {
  const [L, R] = buf(dur);
  const n = L.length;
  let a = 0, b = 0, ph = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const env = p < peak ? Math.pow(Math.sin((p / peak) * Math.PI * 0.5), 2.2) : Math.pow(Math.cos(((p - peak) / (1 - peak)) * Math.PI * 0.5), 1.6);
    const center = lo + (hi - lo) * (p < peak ? p / peak : 1 - ((p - peak) / (1 - peak)) * 0.6);
    const cHi = 1 - Math.exp((-2 * Math.PI * center * 1.6) / SR);
    const cLo = 1 - Math.exp((-2 * Math.PI * center * 0.5) / SR);
    const w = rnd();
    a += (w - a) * cHi;
    b += (w - b) * cLo;
    let v = (a - b) * env;
    if (tone) {
      ph += (2 * Math.PI * (120 + 260 * env)) / SR;
      v += Math.sin(ph) * env * tone;
    }
    L[i] = v * (1 - p * 0.6);
    R[i] = v * (0.4 + p * 0.6);
  }
  write(name, L, R);
}

function click() {
  const [L] = buf(0.09);
  for (let i = 0; i < L.length; i++) {
    const x = i / SR;
    L[i] = Math.sin(2 * Math.PI * 2600 * x) * Math.exp(-x * 220) * 0.6 + Math.sin(2 * Math.PI * 140 * x) * Math.exp(-x * 70) * 0.5 + rnd() * Math.exp(-x * 900) * 0.25;
  }
  write("click", L);
}

function pop(name, f0, f1, dur = 0.12) {
  const [L] = buf(dur);
  let ph = 0;
  for (let i = 0; i < L.length; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * (f1 + (f0 - f1) * Math.exp(-x * 40))) / SR;
    L[i] = Math.sin(ph) * Math.min(1, x / 0.002) * Math.exp(-x * 38);
  }
  write(name, L);
}

function tick() {
  const [L] = buf(0.05);
  for (let i = 0; i < L.length; i++) {
    const x = i / SR;
    L[i] = Math.sin(2 * Math.PI * 3200 * x) * Math.exp(-x * 160) + rnd() * Math.exp(-x * 700) * 0.2;
  }
  write("tick", L);
}

function bellNotes(name, notes, dur, decay = 4) {
  const [L, R] = buf(dur);
  notes.forEach(([t0, f, g, pan]) => {
    const s = Math.round(t0 * SR);
    for (let i = s; i < L.length; i++) {
      const x = (i - s) / SR;
      const v = (Math.sin(2 * Math.PI * f * x) + 0.18 * Math.sin(2 * Math.PI * f * 2.76 * x) * Math.exp(-x * 9)) * Math.min(1, x / 0.003) * Math.exp(-x * decay) * g;
      L[i] += v * (1 - pan);
      R[i] += v * pan;
    }
  });
  write(name, L, R);
}

/** Sonar-style ping with a soft echo. */
function ping() {
  const [L, R] = buf(1.2);
  for (const [t0, g, pan] of [[0, 1, 0.5], [0.22, 0.32, 0.2], [0.44, 0.12, 0.8]]) {
    const s = Math.round(t0 * SR);
    for (let i = s; i < L.length; i++) {
      const x = (i - s) / SR;
      const v = Math.sin(2 * Math.PI * 1480 * x) * Math.min(1, x / 0.004) * Math.exp(-x * 7) * g + Math.sin(2 * Math.PI * 740 * x) * Math.exp(-x * 10) * g * 0.25;
      L[i] += v * (1 - pan);
      R[i] += v * pan;
    }
  }
  write("ping", L, R);
}

function dud() {
  const [L] = buf(0.22);
  let ph = 0;
  for (let i = 0; i < L.length; i++) {
    const x = i / SR;
    ph += (2 * Math.PI * (230 - 70 * Math.min(1, x / 0.15))) / SR;
    L[i] = (Math.sin(ph) + 0.3 * Math.sin(ph * 2)) * Math.min(1, x / 0.004) * Math.exp(-x * 16);
  }
  write("dud", L);
}

function typing(sec) {
  const [L, R] = buf(sec);
  let t = 0.02;
  while (t < sec - 0.05) {
    const s = Math.round(t * SR);
    const f = 1700 + rnd() * 500;
    const g = 0.6 + rnd() * 0.3;
    const pan = 0.5 + rnd() * 0.25;
    for (let k = 0; k < SR * 0.03; k++) {
      const x = k / SR;
      const v = (Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 260) * 0.5 + rnd() * Math.exp(-x * 500) * 0.5 + Math.sin(2 * Math.PI * 180 * x) * Math.exp(-x * 120) * 0.3) * g;
      if (s + k < L.length) {
        L[s + k] += v * (1 - pan);
        R[s + k] += v * pan;
      }
    }
    t += 0.055 + Math.abs(rnd()) * 0.07 + (rnd() > 0.85 ? 0.12 : 0);
  }
  write("typing", L, R);
}

function shimmer() {
  // soft rising air plus a few high bells, for the opening title
  const [L, R] = buf(3);
  let a = 0, b = 0;
  for (let i = 0; i < L.length; i++) {
    const p = i / L.length;
    const env = Math.pow(Math.sin(Math.min(1, p / 0.55) * Math.PI * 0.5), 2) * (p > 0.55 ? Math.exp(-(p - 0.55) * 5) : 1);
    const w = rnd();
    a += (w - a) * (0.08 + p * 0.2);
    b += (w - b) * 0.02;
    const v = (a - b) * env * 0.35;
    L[i] += v;
    R[i] += v * 0.9;
  }
  [[0.9, 1567.98, 0.5, 0.3], [1.15, 2093, 0.4, 0.7], [1.4, 2637, 0.3, 0.5]].forEach(([t0, f, g, pan]) => {
    const s = Math.round(t0 * SR);
    for (let i = s; i < L.length; i++) {
      const x = (i - s) / SR;
      const v = Math.sin(2 * Math.PI * f * x) * Math.min(1, x / 0.004) * Math.exp(-x * 3) * g;
      L[i] += v * (1 - pan);
      R[i] += v * pan;
    }
  });
  write("shimmer", L, R);
}

whoosh("whoosh", 1.3, 0.55, 300, 2400, 0.04);
whoosh("smear", 0.5, 0.4, 600, 4200, 0.02);
pop("drop", 260, 110, 0.25);
whoosh("sweep", 1.7, 0.5, 220, 3200, 0.06);
click();
pop("pop", 900, 520);
pop("pop-low", 620, 380, 0.14);
tick();
bellNotes("chime", [[0, 1318.5, 0.6, 0.4], [0.09, 1975.5, 0.5, 0.6]], 1.4);
bellNotes("outro", [[0, 1046.5, 0.5, 0.3], [0.12, 1318.5, 0.45, 0.5], [0.24, 1568, 0.4, 0.7], [0.36, 2093, 0.3, 0.5]], 3, 2.2);
ping();
dud();
typing(80 / 30);
shimmer();
console.log("sfx written to", OUT, fs.readdirSync(OUT).join(", "));
