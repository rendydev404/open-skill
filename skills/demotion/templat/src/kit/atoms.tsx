import type { ReactNode } from "react";
import { kedip } from "./anim";

/* Atom UI generik. Untuk komponen produk (sidebar, kartu, tabel) tulis di pages/ dengan MENYALIN markup + kelas Tailwind dari kode aplikasi. */

export function Pill({ nada, children }: { nada: "hijau" | "kuning" | "merah" | "abu"; children: ReactNode }) {
  const kelas = { hijau: "bg-accent-soft text-accent", kuning: "bg-warning-soft text-warning", merah: "bg-[#fbe9ec] text-danger", abu: "bg-subtle text-muted" }[nada];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${kelas}`}>{children}</span>;
}

/** Saklar; `p` 0..1 = posisi geser (digerakkan dari waktu: tw(t, tKlik, tKlik+0.2)). */
export function Saklar({ p, cur }: { p: number; cur?: string }) {
  return (
    <span data-cur={cur} className="relative block h-6 w-11 shrink-0 rounded-full" style={{ background: p > 0.5 ? "var(--c-accent)" : "var(--c-line-strong)" }}>
      <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow" style={{ transform: `translateX(${p * 20}px)` }} />
    </span>
  );
}

export function Meter({ persen }: { persen: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-accent-soft">
      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, persen))}%` }} />
    </div>
  );
}

/** Kolom isian yang "diketik": `nilai` = teks yang sudah tampil (pakai ketik()), `fokus` = tampilkan cincin fokus + caret berkedip. */
export function Isi({ label, nilai, placeholder, fokus = false, t, password = false, cur, className = "" }: { label?: string; nilai: string; placeholder?: string; fokus?: boolean; t: number; password?: boolean; cur?: string; className?: string }) {
  const teks = password ? "•".repeat(nilai.length) : nilai;
  return (
    <div className={className}>
      {label && <span className="label">{label}</span>}
      <div data-cur={cur} className={`field flex items-center ${fokus ? "field-fokus" : ""}`} style={{ minHeight: 38 }}>
        {nilai ? <span className="whitespace-pre">{teks}</span> : <span className="text-faint">{placeholder}</span>}
        {fokus && <span className="inline-block h-[1.15em] w-px bg-fg" style={{ opacity: kedip(t) ? 1 : 0, marginLeft: nilai ? 1 : -1 }} />}
      </div>
    </div>
  );
}

/** Lapisan gelap + dialog di tengah (seperti <dialog> dengan backdrop). `p` 0..1 = kemunculan. Taruh di prop `fixed` Stage. */
export function LatarDialog({ p, children }: { p: number; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-[90] grid place-items-center" style={{ opacity: p, background: "rgba(0,0,0,0.45)" }}>
      <div style={{ transform: `translateY(${(1 - p) * 14}px) scale(${0.985 + p * 0.015})` }}>{children}</div>
    </div>
  );
}
