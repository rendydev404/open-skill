import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

/** Konfigurasi video demo (dipakai lewat --config). Tailwind v4 memakai token & kelas yang sama dengan aplikasi. */
Config.overrideWebpackConfig((c) => enableTailwind(c));
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(94);
Config.setOverwriteOutput(true);
