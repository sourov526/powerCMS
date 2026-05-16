import localFont from "next/font/local";

export const fontInter = localFont({
  src: [
    {
      path: "../assets/fonts/Inter-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const fontNotoSansJP = localFont({
  src: [
    {
      path: "../assets/fonts/NotoSansJP-VariableFont_wght.ttf",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export function getLocaleFontClasses(locale?: string) {
  const isJapanese = (locale ?? "").toLowerCase().startsWith("ja");
  return {
    robotoOrZen: isJapanese ? "font-noto-jp" : "font-inter",
    arialOrNoto: isJapanese ? "font-noto-jp" : "font-inter",
  };
}
