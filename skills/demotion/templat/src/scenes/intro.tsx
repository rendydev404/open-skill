import { AbsoluteFill } from "remotion";
import { BRAND } from "../config";
import { E, pegas, tw, useT } from "../kit/anim";
import { Backdrop } from "../kit/stage";

/** Pembuka: nama produk + janji satu kalimat + (opsional) peta perjalanan demo. Ganti teks sesuai produk. */
export function Intro() {
  const t = useT();
  const m = pegas(t, 0.25, 15, 120);
  const j = tw(t, 1.0, 1.9, 0, 1, E.out);
  const s = tw(t, 1.9, 2.7, 0, 1, E.out);
  return (
    <AbsoluteFill className="font-sans">
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", display: "flex" }}>
        <div style={{ opacity: m, transform: `scale(${0.7 + 0.3 * m})`, color: "#fff", fontSize: 110, fontWeight: 800, letterSpacing: -2 }}>{BRAND.nama}</div>
        <h1 style={{ marginTop: 40, textAlign: "center", fontSize: 64, fontWeight: 800, lineHeight: 1.1, color: BRAND.aksen, opacity: j, transform: `translateY(${(1 - j) * 26}px)` }}>Satu kalimat janji produk.</h1>
        <p style={{ marginTop: 24, fontSize: 30, fontWeight: 500, color: BRAND.redup, opacity: s, transform: `translateY(${(1 - s) * 18}px)` }}>Demo lengkap dari sisi pengguna</p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
