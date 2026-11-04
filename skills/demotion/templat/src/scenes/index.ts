import type { ComponentType } from "react";
import { bangunPeta, type Peta } from "../kit/timemap";
import { Contoh, DUR as DUR_CONTOH } from "./contoh";
import { Intro } from "./intro";
import { POTONG } from "./potong";

export interface SceneDef {
  id: string;
  /** Durasi video scene (detik) setelah dipotong/dipercepat. */
  dur: number;
  /** Peta waktu asli -> video. */
  peta: Peta;
  /** Tampilkan lencana kecepatan saat dipercepat. */
  chip: boolean;
  Comp: ComponentType;
}

/** `durAsli` = durasi scene tanpa potongan; bila id ada di POTONG, durasi video = jumlah segmen terpetakan. */
const buat = (id: string, Comp: ComponentType, durAsli: number, chip = true): SceneDef => {
  const peta = bangunPeta(POTONG[id] ?? [{ a: 0, b: durAsli, v: 1 }]);
  return { id, dur: peta.dur, peta, chip, Comp };
};

/** Urutan scene video demo. Tiap scene tumpang-tindih 0,4 dtk dengan sebelumnya (silang-pudar). Tambah scene baru di sini. */
export const SCENES: SceneDef[] = [
  buat("intro", Intro, 6, false),
  buat("contoh", Contoh, DUR_CONTOH),
];

const TUMPANG = 0.4;
export const mulaiScene = (i: number) => SCENES.slice(0, i).reduce((a, s) => a + s.dur - TUMPANG, 0);
export const TOTAL_DETIK = SCENES.reduce((a, s) => a + s.dur, 0) - TUMPANG * (SCENES.length - 1);
