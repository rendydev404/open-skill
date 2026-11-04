import type { Theme } from "./theme";

/** Lucide icon name, e.g. "TrendingUp", "Globe", "Flame" (https://lucide.dev/icons). */
export type IconName = string;

/** Headline: bold sans part + italic serif part; `mark` = one word of the serif part that gets the highlighter. */
export type Title = { sans: string; serif: string; mark?: string };

type Base = { label?: string; dur?: number };

export type Scene =
  | (Base & { type: "spark"; caption: string })
  | (Base & { type: "word"; word: string; mark?: boolean; cards: { icon: IconName; title: string; meta: string }[]; counter?: { label: string; to: number } })
  | (Base & { type: "tagline"; sans: string; serif: string; mark?: string; dip?: boolean })
  | (Base & {
      type: "bento";
      kicker: string;
      title: Title;
      feature: { icon: IconName; title: string; meta: string; lines: string[]; footer?: string };
      cards: { icon: IconName; title: string; meta: string; viz: "dots" | "chips" | "bars" | "clock" | "text"; chips?: string[]; value?: string }[];
      wide?: { icon: IconName; title: string; meta: string; quote: string };
    })
  | (Base & { type: "checklist"; kicker: string; title: Title; items: { text: string; ok: boolean; reason?: string }[]; okBadge?: string; noBadge?: string; summaryLabel: string })
  | (Base & { type: "steps"; kicker: string; title: Title; steps: string[]; results?: string[]; resultMeta?: string })
  | (Base & { type: "formula"; kicker: string; title: Title; metrics: { label: string; value: number; hint: string }[]; total: { label: string; value: number; suffix?: string }; footnote?: string })
  | (Base & {
      type: "showcase";
      line1: string;
      line2: string;
      mark?: string;
      body?: string;
      card: { avatar: string; name: string; status?: string; text: string; imageText?: string };
      action: { label: string; done: string; badge: string };
    })
  | (Base & { type: "stats"; items: { value: number | string; label: string }[] })
  | (Base & { type: "kinetic"; words: { text: string; sub?: string }[] })
  | (Base & { type: "logo"; name: string; accentWord?: string; tagline: string; mark?: string; cta?: string });

export type ReelConfig = {
  brand: {
    /** Top-left HUD text, e.g. "ACME / LAUNCH REEL '26". */
    hudLabel: string;
    /** File in public/ (png/webp/svg) or null to draw initials. */
    logo: string | null;
    initials?: string;
  };
  theme: Theme;
  /** Set false for a silent render. */
  sfx?: boolean;
  scenes: Scene[];
};
