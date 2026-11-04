import type { RefObject } from "react";

export type CursorKind = "arrow" | "text";

export interface CursorRefs {
  root: RefObject<HTMLDivElement | null>;
  shape: RefObject<HTMLDivElement | null>;
  arrow: RefObject<SVGSVGElement | null>;
  text: RefObject<SVGSVGElement | null>;
  ripple: RefObject<HTMLDivElement | null>;
  ripple2: RefObject<HTMLDivElement | null>;
}

/**
 * Kursor gaya macOS. Posisi/skala/riak klik diatur lewat ref oleh Stage (per-frame, tanpa state React),
 * jadi tidak ada animasi CSS yang berjalan di jam browser.
 */
export function Cursor({ refs }: { refs: CursorRefs }) {
  return (
    <div ref={refs.root} className="pointer-events-none absolute top-0 left-0 z-[200]" style={{ willChange: "transform" }}>
      <div ref={refs.ripple} className="absolute rounded-full" style={{ left: 0, top: 0, width: 0, height: 0, border: "2.5px solid rgba(61,220,151,0.95)", opacity: 0 }} />
      <div ref={refs.ripple2} className="absolute rounded-full" style={{ left: 0, top: 0, width: 0, height: 0, background: "rgba(61,220,151,0.28)", opacity: 0 }} />
      <div ref={refs.shape} style={{ transformOrigin: "2px 2px", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.38))" }}>
        <svg ref={refs.arrow} width="26" height="30" viewBox="0 0 26 30" style={{ display: "block", overflow: "visible" }}>
          <path d="M2 2 L2 23.5 L7.6 18.4 L11.3 26.6 L15 25 L11.3 16.9 L18.8 16.9 Z" fill="#0b1813" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <svg ref={refs.text} width="26" height="30" viewBox="0 0 26 30" style={{ display: "none", overflow: "visible", position: "absolute", left: -9, top: -11 }}>
          <path d="M9 4.5h8M13 4.5v20M9 24.5h8" fill="none" stroke="#ffffff" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M9 4.5h8M13 4.5v20M9 24.5h8" fill="none" stroke="#0b1813" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
