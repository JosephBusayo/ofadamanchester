import {
  Anton,
  Bowlby_One_SC,
  Inter,
  Knewave,
  League_Gothic,
  Oswald,
  Permanent_Marker,
  Space_Mono,
} from "next/font/google";

// Same families as the Framer reference design (see CLAUDE.md → Fonts).
export const leagueGothic = League_Gothic({
  subsets: ["latin"],
  variable: "--font-league-gothic",
  display: "swap",
});

export const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

export const bowlby = Bowlby_One_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bowlby",
  display: "swap",
});

export const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const knewave = Knewave({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-knewave",
  display: "swap",
});

export const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-permanent-marker",
  display: "swap",
});

// Receipt "PAID" stamp.
export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const fontVariables = [
  leagueGothic,
  oswald,
  bowlby,
  spaceMono,
  knewave,
  permanentMarker,
  anton,
  inter,
]
  .map((f) => f.variable)
  .join(" ");
