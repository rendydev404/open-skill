import type { CSSProperties, ReactNode } from "react";
import { Camera, ChevronLeft, Mic, Phone as Telp, Plus, Video } from "lucide-react";
import { putar } from "./anim";

/** Ponsel (iPhone) datar dengan layar logis 390 x 844. `scale` mengecilkan seluruhnya. */
export const PHONE_W = 414;
export const PHONE_H = 868;

export function Phone({ children, scale = 1, style }: { children: ReactNode; scale?: number; style?: CSSProperties }) {
  return (
    <div style={{ width: PHONE_W * scale, height: PHONE_H * scale, ...style }}>
      <div
        style={{
          width: PHONE_W,
          height: PHONE_H,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          borderRadius: 60,
          background: "linear-gradient(145deg,#5a626b,#1b1f24 40%,#343a42)",
          padding: 3,
          boxShadow: "0 60px 110px -24px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ background: "#000", borderRadius: 57, padding: 9, height: "100%" }}>
          <div className="font-sans" style={{ position: "relative", width: "100%", height: "100%", borderRadius: 48, overflow: "hidden", background: "#fff" }}>
            {children}
            <div style={{ position: "absolute", top: 11, left: "50%", width: 118, height: 34, marginLeft: -59, borderRadius: 20, background: "#000", zIndex: 40 }} />
            <div style={{ position: "absolute", bottom: 8, left: "50%", width: 136, height: 5, marginLeft: -68, borderRadius: 3, background: "#111", zIndex: 40 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const WA = { hijau: "#25d366", keluar: "#d9fdd3", masuk: "#ffffff", teks: "#111b21", abu: "#667781", centang: "#53bdeb", wallpaper: "#efeae2", bilah: "#f6f6f6" };

export interface Gel {
  /** "kita" = pemilik ponsel (kanan, hijau muda); "lawan" = lawan bicara (kiri, putih). */
  dari: "kita" | "lawan";
  teks?: string;
  gambar?: ReactNode;
  jam: string;
  baca?: boolean;
  /** 0..1 progres kemunculan. */
  muncul: number;
  kutip?: { nama: string; teks: string };
}

const Centang = ({ biru }: { biru: boolean }) => (
  <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden>
    <path d="M11.07.65 4.6 7.12 2.1 4.6l-.95.95L4.6 9 12 1.6zM15.05.65 8.6 7.12l-.6-.6-.95.95L8.6 9 16 1.6z" fill={biru ? WA.centang : "#8696a0"} />
  </svg>
);

function BilahStatus() {
  return (
    <div className="absolute inset-x-0 top-0 z-30 flex h-[52px] items-end justify-between px-9 pb-1.5 text-[16px] font-semibold text-black">
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 34 22">{[0, 1, 2, 3].map((k) => <rect key={k} x={k * 9} y={16 - k * 5} width="6.5" height={6 + k * 5} rx="1.6" fill="#000" />)}</svg>
        <svg width="25" height="12" viewBox="0 0 50 23"><rect x="1" y="1" width="42" height="21" rx="6.5" fill="none" stroke="#000" strokeOpacity="0.4" strokeWidth="2" /><rect x="4" y="4" width="32" height="15" rx="4" fill="#000" /></svg>
      </span>
    </div>
  );
}

const WARNA = ["#f59e0b", "#6366f1", "#14b8a6", "#ec4899", "#22c55e"];

function Gelembung({ g }: { g: Gel }) {
  const kita = g.dari === "kita";
  const m = g.muncul;
  return (
    <div style={{ display: "flex", justifyContent: kita ? "flex-end" : "flex-start", padding: "0 12px", opacity: m, transform: `translateY(${(1 - m) * 20}px) scale(${0.95 + m * 0.05})`, transformOrigin: kita ? "right bottom" : "left bottom" }}>
      <div style={{ maxWidth: "80%", padding: "6px 9px 5px 10px", borderRadius: 11, background: kita ? WA.keluar : WA.masuk, color: WA.teks, fontSize: 16, lineHeight: 1.32, boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)" }}>
        {g.kutip && (
          <div style={{ display: "flex", borderRadius: 7, background: kita ? "#cfe9c7" : "#f0f0f0", overflow: "hidden", marginBottom: 4 }}>
            <span style={{ width: 4, background: "#7f66ff" }} />
            <div style={{ padding: "4px 8px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#7f66ff" }}>{g.kutip.nama}</div>
              <div style={{ fontSize: 13.5, color: "#54656f" }}>{g.kutip.teks}</div>
            </div>
          </div>
        )}
        {g.gambar}
        {g.teks && <span style={{ whiteSpace: "pre-wrap" }}>{g.teks}</span>}
        <span style={{ float: "right", display: "inline-flex", alignItems: "center", gap: 3, margin: "9px 0 -2px 10px", fontSize: 11, color: WA.abu }}>
          {g.jam}
          {kita && <Centang biru={!!g.baca} />}
        </span>
      </div>
    </div>
  );
}

/** Layar percakapan WhatsApp (gaya iOS). `mengetik` 0..1 menampilkan gelembung "sedang mengetik" dari lawan bicara. */
export function WaScreen({ nama, inisial, warna = 0, status, pesan, mengetik = 0, t, input = "" }: { nama: string; inisial: string; warna?: number; status: string; pesan: Gel[]; mengetik?: number; t: number; input?: string }) {
  const w = WARNA[warna % WARNA.length];
  return (
    <div className="absolute inset-0" style={{ background: WA.wallpaper }}>
      <BilahStatus />
      <div className="absolute inset-x-0 top-0 z-20 flex items-end gap-1.5 px-2 pb-2" style={{ height: 106, background: "rgba(246,246,246,0.97)", borderBottom: "1px solid #d8d8d8" }}>
        <ChevronLeft className="mb-1 size-7 text-[#007aff]" strokeWidth={2.4} />
        <span className="grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white" style={{ background: w }}>{inisial}</span>
        <div className="min-w-0 flex-1 pl-1.5">
          <div className="truncate text-[16.5px] leading-tight font-semibold text-black">{nama}</div>
          <div className="text-[12.5px] leading-tight" style={{ color: status.includes("mengetik") ? "#25a244" : WA.abu }}>{status}</div>
        </div>
        <Video className="mb-1.5 size-[26px] text-[#007aff]" />
        <Telp className="mb-1.5 ml-3 size-[22px] text-[#007aff]" />
      </div>
      <div className="absolute inset-x-0 flex flex-col justify-end gap-1 overflow-hidden" style={{ top: 106, bottom: 86 }}>
        {pesan.filter((g) => g.muncul > 0.001).map((g, i) => (
          <Gelembung key={i} g={g} />
        ))}
        {mengetik > 0.01 && (
          <div style={{ padding: "0 12px", opacity: mengetik, transform: `translateY(${(1 - mengetik) * 12}px)` }}>
            <div className="inline-flex items-center gap-1.5 rounded-[11px] bg-white px-3.5 py-3" style={{ boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)" }}>
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-2 rounded-full bg-[#8696a0]" style={{ transform: `translateY(${-Math.abs(Math.sin(t * 6 - d * 0.7)) * 4}px)`, opacity: 0.55 + Math.abs(Math.sin(t * 6 - d * 0.7)) * 0.45 }} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-start gap-2.5 px-3 pt-2" style={{ height: 86, background: WA.bilah, borderTop: "1px solid #d8d8d8" }}>
        <Plus className="mt-1 size-7 text-[#007aff]" strokeWidth={2} />
        <div className="flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-full border border-[#e0e0e0] bg-white px-3.5 text-[16px] text-black">
          <span className="truncate">{input}</span>
        </div>
        <Camera className="mt-1 size-7 text-[#007aff]" />
        <Mic className="mt-1 size-7 text-[#007aff]" />
      </div>
    </div>
  );
}

/** Gambar "bukti transfer" bergaya tangkapan layar m-banking untuk gelembung (nominal & penerima bebas). */
export function FotoBukti({ nominal = "Rp 100.000", ke = "NAMA USAHA", tanggal = "3 Nov 2026 14:02" }: { nominal?: string; ke?: string; tanggal?: string }) {
  return (
    <div className="mb-1 w-[230px] overflow-hidden rounded-lg" style={{ background: "linear-gradient(160deg,#e9f5ff,#fff)" }}>
      <div className="flex items-center gap-2 bg-[#0066ae] px-3 py-2 text-[12px] font-bold text-white">
        <span className="grid size-5 place-items-center rounded bg-white text-[10px] text-[#0066ae]">B</span> Transfer berhasil
      </div>
      <div className="space-y-1 px-3 py-2.5 text-[11.5px] text-[#35424a]">
        <div className="text-[18px] font-extrabold text-[#111b21]">{nominal}</div>
        <div>Ke: {ke}</div>
        <div className="font-semibold text-[#0f7a5c]">● Berhasil · {tanggal}</div>
      </div>
    </div>
  );
}

/** Spinner kecil (digerakkan dari waktu, bukan CSS). */
export function Spin({ t, className = "size-4" }: { t: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ transform: `rotate(${putar(t)}deg)` }} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.2-8.55" />
    </svg>
  );
}
