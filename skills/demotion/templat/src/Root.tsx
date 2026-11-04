import "./fonts";
import "./index.css";
import { type ReactNode, useEffect, useState } from "react";
import { AbsoluteFill, Composition, Sequence, useCurrentFrame, useDelayRender } from "remotion";
import { CH, CW, FPS } from "./config";
import { FONT_FACES } from "./fonts";
import { tw } from "./kit/anim";
import { KonteksWaktu, waktuAsli } from "./kit/timemap";
import { SCENES, type SceneDef, TOTAL_DETIK, mulaiScene } from "./scenes";

/** Tunggu font produk siap sebelum frame mana pun dirender. */
function FontGate({ children }: { children: ReactNode }) {
  const { delayRender, continueRender } = useDelayRender();
  const [siap, setSiap] = useState(false);
  const [h] = useState(() => delayRender("font produk"));
  useEffect(() => {
    Promise.all(FONT_FACES.map((f) => document.fonts.load(f))).then(() => {
      setSiap(true);
      continueRender(h);
    });
  }, [h, continueRender]);
  return siap ? <>{children}</> : null;
}

/** Fade masuk/keluar di tepi scene, dip singkat di tiap potongan lompat, dan lencana saat dipercepat. */
function Pudar({ s, children }: { s: SceneDef; children: ReactNode }) {
  const tv = useCurrentFrame() / FPS;
  const w = waktuAsli(s.peta, tv);
  const tepi = Math.min(tw(tv, 0, 0.4), 1 - tw(tv, s.dur - 0.4, s.dur));
  const dip = s.peta.potongan.reduce((a, tc) => Math.max(a, 1 - Math.min(1, Math.abs(tv - tc) / 0.1)), 0);
  const cepat = s.chip && w.v >= 1.9;
  const label = Number.isInteger(w.v) ? `${w.v}` : w.v.toFixed(1).replace(/\.0$/, "");
  return (
    <AbsoluteFill style={{ opacity: tepi * (1 - dip * 0.92) }}>
      {children}
      {cepat && (
        <div className="font-sans" style={{ position: "absolute", top: 52, right: 56, display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 14, background: "rgba(8,20,15,0.92)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 24, fontWeight: 800, letterSpacing: 0.5 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M3 5l8 7-8 7zM12 5l8 7-8 7z" /></svg>
          {label}x
        </div>
      )}
    </AbsoluteFill>
  );
}

function Demo() {
  return (
    <FontGate>
      <AbsoluteFill style={{ background: "#06100c" }}>
        {SCENES.map((s, i) => (
          <Sequence key={s.id} from={Math.round(mulaiScene(i) * FPS)} durationInFrames={Math.round(s.dur * FPS)} name={s.id}>
            <KonteksWaktu value={s.peta}>
              <Pudar s={s}>
                <s.Comp />
              </Pudar>
            </KonteksWaktu>
          </Sequence>
        ))}
      </AbsoluteFill>
    </FontGate>
  );
}

/** Satu scene saja (id "S-<scene>"): dipakai untuk uji cepat lewat `remotion still` / Studio. */
function SatuScene({ i }: { i: number }) {
  const s = SCENES[i];
  return (
    <FontGate>
      <KonteksWaktu value={s.peta}>
        <Pudar s={s}>
          <s.Comp />
        </Pudar>
      </KonteksWaktu>
    </FontGate>
  );
}

export function DemoRoot() {
  return (
    <>
      <Composition id="Demo" component={Demo} durationInFrames={Math.round(TOTAL_DETIK * FPS)} fps={FPS} width={CW} height={CH} />
      {SCENES.map((s, i) => (
        <Composition key={s.id} id={`S-${s.id}`} component={SatuScene} defaultProps={{ i }} durationInFrames={Math.max(1, Math.round(s.dur * FPS))} fps={FPS} width={CW} height={CH} />
      ))}
    </>
  );
}
