import AnimatePulse from "@/components/atoms/AnimatePulse";
import Footer from "@/components/navigations/Footer";
import Header from "@/components/navigations/header/Header";

export default function Loading() {
  return (
    <div className="font-sans min-h-dvh flex flex-col bg-brand-offwhite">
      <Header spacer={false} position="absolute" />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-brand-offwhite pt-[72px] md:pt-[140px] lg:pt-[140px]">
          <div className="px-4 pb-8 md:pb-10 md:px-8 lg:max-w-none lg:pb-12 lg:pl-20 lg:pr-0">
            <div className="grid items-stretch gap-6 lg:grid-cols-[0.8fr_1.1fr] lg:gap-10">
              <div className="flex h-full flex-col justify-center py-2 lg:py-6">
                <AnimatePulse heightClassName="h-4" className="max-w-[280px]" />
                <AnimatePulse
                  heightClassName="h-20"
                  className="mt-4 max-w-[520px] md:h-28 lg:h-28"
                />
                <AnimatePulse
                  heightClassName="h-16"
                  className="mt-6 max-w-[560px]"
                />
                <div className="hidden pt-8 items-stretch gap-4 md:flex lg:flex">
                  <AnimatePulse
                    heightClassName="h-[56px]"
                    className="w-[196px]"
                  />
                  <AnimatePulse
                    heightClassName="h-[56px]"
                    className="w-[196px]"
                  />
                </div>
              </div>

              <div className="relative min-h-[288px] overflow-hidden rounded-[24px] bg-brand-mist lg:min-h-[664px] lg:rounded-l-[26px] lg:rounded-r-none">
                <AnimatePulse
                  heightClassName="h-full"
                  className="absolute inset-0 rounded-[24px] lg:rounded-l-[26px] lg:rounded-r-none"
                />
                <AnimatePulse
                  heightClassName="h-14"
                  className="absolute right-0 top-0 w-[130px] rounded-bl-[10px]"
                />
                <AnimatePulse
                  heightClassName="h-[94px]"
                  className="absolute bottom-0 left-0 w-[230px] rounded-tr-[8px]"
                />
              </div>

              <div className="flex flex-col items-stretch gap-3 lg:hidden">
                <AnimatePulse heightClassName="h-[48px]" />
                <AnimatePulse heightClassName="h-[48px]" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0b1320] text-white">
          <div className="border-x border-white/55">
            <div className="border-b border-white/35 px-4 py-3 md:px-10 lg:px-10">
              <div className="grid gap-2 md:grid-cols-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <AnimatePulse
                    key={idx}
                    heightClassName="h-7"
                    className="bg-white/15"
                  />
                ))}
              </div>
            </div>
            <div className="w-full px-4 py-8 md:px-8 md:py-14 lg:px-[208px] lg:py-16">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="space-y-2">
                    <AnimatePulse
                      heightClassName="h-10"
                      className="bg-white/15"
                    />
                    <AnimatePulse
                      heightClassName="h-4"
                      className="bg-white/15"
                    />
                    <AnimatePulse
                      heightClassName="h-3"
                      className="bg-white/15"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-brand-offwhite">
          <div className="container py-14 md:py-20 lg:py-20">
            <div className="mx-auto max-w-[420px] space-y-4">
              <AnimatePulse heightClassName="h-3" />
              <AnimatePulse heightClassName="h-8" />
            </div>
            <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-3 lg:mt-14 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-[12px] bg-white/50 p-5 space-y-3"
                >
                  <AnimatePulse
                    heightClassName="h-[78px]"
                    className="mx-auto w-[78px] rounded-full"
                  />
                  <AnimatePulse
                    heightClassName="h-5"
                    className="mx-auto max-w-[220px]"
                  />
                  <AnimatePulse
                    heightClassName="h-12"
                    className="mx-auto max-w-[260px]"
                  />
                </div>
              ))}
            </div>
            <AnimatePulse
              heightClassName="h-28"
              className="mx-auto mt-12 max-w-[1120px] rounded-[12px]"
            />
          </div>
        </section>

        <section className="bg-[#E4E3DF] rounded-t-[20px] md:rounded-t-[30px] lg:rounded-t-[40px]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-6 px-4 py-8 md:gap-8 md:px-8 md:py-12 lg:gap-10 lg:px-[120px] lg:py-[80px]">
            <div className="w-full space-y-4">
              <AnimatePulse heightClassName="h-3" className="max-w-[140px]" />
              <AnimatePulse heightClassName="h-8" className="max-w-[220px]" />
            </div>
            <div className="w-full space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <AnimatePulse
                  key={idx}
                  heightClassName="h-[84px]"
                  className="rounded-[8px]"
                />
              ))}
            </div>
            <AnimatePulse
              heightClassName="h-[48px]"
              className="w-full lg:w-[180px]"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
