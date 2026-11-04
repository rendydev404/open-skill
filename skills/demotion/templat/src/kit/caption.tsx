import { BRAND, CH, CW } from "../config";
import { tampil } from "./anim";
import { useWaktu } from "./timemap";

export interface Cap {
  from: number;
  to: number;
  /** Penanda kecil di kiri (mis. "LANGKAH 2"). */
  label?: string;
  title: string;
  sub?: string;
  /** Posisi vertikal: bawah (bawaan) atau atas. */
  pos?: "bawah" | "atas";
}

/** Keterangan melayang di bagian bawah layar (di atas kamera, tidak ikut zoom). */
export function Captions({ items }: { items: Cap[] }) {
  const { t, v } = useWaktu();
  return (
    <>
      {items.map((c, i) => {
        if ((c.to - c.from) / v < 1.2) return null;
        const a = tampil(t, c.from, c.to, 0.42, 0.32);
        if (a <= 0.001) return null;
        const atas = c.pos === "atas";
        return (
          <div
            key={i}
            className="font-sans"
            style={{ position: "absolute", left: 0, width: CW, [atas ? "top" : "top"]: atas ? 74 : CH - 168, display: "flex", justifyContent: "center", opacity: a, transform: `translateY(${(1 - a) * (atas ? -18 : 22)}px)`, pointerEvents: "none" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "16px 28px 16px 18px",
                borderRadius: 22,
                background: BRAND.kaca,
                border: "1px solid rgba(232,240,236,0.14)",
                boxShadow: "0 24px 60px -18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
                maxWidth: 1380,
              }}
            >
              {c.label && (
                <span style={{ flexShrink: 0, borderRadius: 12, background: BRAND.aksen, color: BRAND.tinta, fontSize: 15, fontWeight: 700, letterSpacing: 1.2, padding: "8px 13px" }}>{c.label}</span>
              )}
              <div>
                <div style={{ color: "#fff", fontSize: 27, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}>{c.title}</div>
                {c.sub && <div style={{ color: BRAND.redup, fontSize: 19, fontWeight: 500, marginTop: 4, lineHeight: 1.3 }}>{c.sub}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
