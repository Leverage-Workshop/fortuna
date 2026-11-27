// DESIGN.md §4: display (wordmark, page titles), sans (UI), mono (data), serif (model prose).
// Variable names differ from the Tailwind theme names so the theme doesn't reference itself.
import { Anton, JetBrains_Mono, Newsreader, Space_Grotesk } from "next/font/google";

export const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
export const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
export const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const fontVariables = [anton, spaceGrotesk, jetbrainsMono, newsreader].map((f) => f.variable).join(" ");
