import { Inter, Noto_Naskh_Arabic, Noto_Sans_Tamil, Outfit } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--sanctuary-inter", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--sanctuary-outfit", display: "swap", preload: false });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--sanctuary-tamil", display: "swap", preload: false });
const arabic = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--sanctuary-arabic", display: "swap", preload: false });

export const jwsFontVariables = `${inter.variable} ${outfit.variable} ${tamil.variable} ${arabic.variable}`;
