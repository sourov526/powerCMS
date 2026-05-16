export const runtime = "nodejs";

import HomeHero from "@/app/_components/home/HomeHero";
import Footer from "@/components/navigations/Footer";
import Header from "@/components/navigations/header/Header";

export default async function HomePage() {
  return (
    <div className="font-sans min-h-dvh flex flex-col bg-brand-offwhite">
      <Header spacer={false} position="absolute" />
      <main className="flex-1">
        <HomeHero />
      </main>
      <Footer />
    </div>
  );
}
