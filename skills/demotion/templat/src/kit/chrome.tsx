import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Lock, RotateCw } from "lucide-react";
import { BRAND, CHROME_H } from "../config";

/** Bilah atas jendela browser (lampu lalu lintas + panah + alamat). Tinggi logis = CHROME_H. `favicon` = logo kecil merek. */
export function BrowserChrome({ url, judul, favicon }: { url: string; judul?: string; favicon?: ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-0 flex items-center gap-4 px-4" style={{ height: CHROME_H, background: "linear-gradient(#eef0ee, #e3e6e4)", borderBottom: "1px solid #c9cfcb" }}>
      <div className="flex gap-2">
        <span className="size-3 rounded-full" style={{ background: "#ff5f57", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)" }} />
        <span className="size-3 rounded-full" style={{ background: "#febc2e", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)" }} />
        <span className="size-3 rounded-full" style={{ background: "#28c840", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)" }} />
      </div>
      <div className="flex items-center gap-3 text-[#6b7571]">
        <ArrowLeft className="size-4" />
        <ArrowRight className="size-4 opacity-50" />
        <RotateCw className="size-[15px]" />
      </div>
      <div className="mx-auto flex h-8 w-[640px] items-center gap-2 rounded-full bg-white px-4 text-[13px]" style={{ boxShadow: "inset 0 0 0 1px #d3d8d5" }}>
        <Lock className="size-3.5 text-[#6b7571]" />
        <span className="font-semibold text-[#1c2622]">{BRAND.domain}</span>
        <span className="text-[#6b7571]">{url}</span>
      </div>
      <div className="flex w-[148px] items-center justify-end gap-2 text-[12px] font-semibold text-[#4f5a55]">
        {favicon ?? <span className="size-3.5 rounded-full" style={{ background: BRAND.aksen }} />}
        <span className="truncate">{judul ?? BRAND.nama}</span>
      </div>
    </div>
  );
}
