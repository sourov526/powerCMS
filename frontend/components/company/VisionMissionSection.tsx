import { Text } from "@/components/atoms/typography/Text";
import Image from "next/image";

const cards = [
  {
    key: "vision",
    title: "Vision",
    mobileHeightClass: "h-[240px]",
    mobileTrackingClass: "tracking-[0.05em]",
    descriptionLines: ["絶え間なく変化する世界に", "革新的な価値を"],
    mainIconSrc: "/images/company/vision-main.svg",
    hoverIconSrc: "/images/company/vision-hover.svg",
    iconAlt: "Vision icon",
    titleColor: "text-[#1F8A5A]",
    bodyColor: "text-[#1F8A5A]",
    hoverBg: "hover:bg-[#1F8A5A]",
    hoverTextColorClass: "group-hover:text-[#F4F4F2]",
  },
  {
    key: "mission",
    title: "Mission",
    mobileHeightClass: "h-[260px]",
    mobileTrackingClass: "tracking-normal",
    descriptionLines: [
      "エネルギーの安定供給と脱炭素化を両立し、",
      "蓄電・制御ソリューションで持続可能な",
      "社会インフラを支える。",
    ],
    mainIconSrc: "/images/company/mission-main.svg",
    hoverIconSrc: "/images/company/mission-hover.svg",
    iconAlt: "Mission icon",
    titleColor: "text-[#252422]",
    bodyColor: "text-[#252422]",
    hoverBg: "hover:bg-[#2BB673]",
    hoverTextColorClass: "group-hover:text-[#FFFFFF]",
  },
] as const;

export default function VisionMissionSection() {
  return (
    <section className="bg-brand-offwhite">
      <div className="container py-8 lg:py-20">
        <div className="flex flex-col gap-6 lg:gap-10">
          <div className="flex flex-col gap-2 lg:gap-3">
            <p className="flex items-center gap-2 font-inter text-center text-[10px] font-bold uppercase leading-[1.6] tracking-[0.05em] text-[#1F8A5A] lg:text-[12px]">
              <span
                className="h-[2px] w-[18px] shrink-0 bg-[#1F8A5A] lg:w-[20px]"
                aria-hidden="true"
              />
              <Text text="VISION & MISSION" />
            </p>

            <div className="font-noto-jp text-[20px] font-bold leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-[30px]">
              <Text text="ビジョン＆ミッション" />
            </div>
          </div>

          <div className="lg:px-20">
            <div className="grid items-stretch justify-items-center gap-6 lg:grid-cols-2 lg:justify-items-stretch lg:gap-10">
              {cards.map((card) => (
                <article
                  key={card.key}
                  className={`group flex w-full max-w-[343px] flex-col items-end gap-4 rounded-[12px] border-2 border-[#C8C7C2] bg-[#FFF] p-6 transition-colors duration-200 ${card.mobileHeightClass} ${card.hoverBg} lg:h-[360px] lg:max-w-none lg:items-stretch lg:justify-between lg:gap-0 lg:rounded-[12px] lg:p-10`}
                >
                  <div className="flex justify-end">
                    <div className="relative h-[80px] w-[80px] shrink-0 aspect-square lg:h-[120px] lg:w-[120px]">
                      <Image
                        src={card.mainIconSrc}
                        alt={card.iconAlt}
                        width={120}
                        height={120}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-contain transition-opacity duration-200 group-hover:opacity-0"
                        unoptimized
                      />
                      <Image
                        src={card.hoverIconSrc}
                        alt=""
                        width={120}
                        height={120}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        aria-hidden="true"
                        unoptimized
                      />
                    </div>
                  </div>

                  <div
                    className={`self-stretch font-inter text-[20px] font-extrabold leading-[1.2] transition-colors duration-200 lg:text-[40px] ${card.hoverTextColorClass} ${card.titleColor}`}
                  >
                    <Text text={card.title} />
                  </div>
                  <p
                    className={`flex self-stretch flex-col items-start text-left font-noto-jp text-[14px] font-bold leading-[1.6] transition-colors duration-200 ${card.mobileTrackingClass} lg:w-[420px] lg:text-[20px] lg:tracking-[1px] ${card.hoverTextColorClass} ${card.bodyColor}`}
                  >
                    {card.descriptionLines.map((line) => (
                      <Text
                        key={line}
                        text={line}
                        className="block w-full whitespace-nowrap"
                      />
                    ))}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
