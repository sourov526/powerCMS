import { Text } from "@/components/atoms/typography/Text";
import Image from "next/image";

export default function MessageFromCeoSection() {
  return (
    <section className="rounded-t-[20px] lg:rounded-t-[40px] bg-[#E4E3DF]">
      <div className="container py-8 lg:py-20">
        <div className="flex flex-col gap-6 lg:gap-12">
          <div className="flex flex-col gap-[10px] lg:gap-[12px]">
            <div className="flex items-center gap-2">
              <span
                className="h-[2px] w-[20px] shrink-0 bg-[#1F8A5A]"
                aria-hidden="true"
              />
              <div className="flex h-[20px] w-full flex-col justify-center font-inter text-[10px] font-bold uppercase leading-[1.6] tracking-[0.05em] text-[#1F8A5A] lg:w-[392px] lg:text-[12px] lg:tracking-[0.6px]">
                <Text text="MESSAGE FROM CEO" />
              </div>
            </div>

            <div className="text-left font-noto-jp text-[20px] font-bold leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-left lg:text-[30px]">
              <Text text="代表メッセージ" />
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-16">
            <div className="w-full overflow-hidden rounded-[8px] bg-[rgba(255,255,255,0.70)] lg:w-[300px] lg:shrink-0 lg:bg-[rgba(255,255,255,0.90)]">
              <div className="h-[400px] lg:h-[355px]">
                <Image
                  src="/images/top/top-page06.webp"
                  alt="代表取締役 沖野 強一"
                  width={600}
                  height={710}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 lg:justify-between lg:gap-6 lg:py-6">
              <div className="flex flex-col">
                <div className="font-inter text-[12px] font-normal uppercase leading-[1.6] tracking-[0.05em] text-[#1F8A5A]">
                  <Text text="代表取締役" />
                </div>
                <div className="font-noto-jp text-[20px] font-bold leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-[30px]">
                  <Text text="沖野 強一" />
                </div>
              </div>

              <div className="flex flex-col gap-[1.7em] font-noto-jp text-[14px] font-normal leading-[1.7] tracking-[0.05em] text-[#252422] lg:text-[16px]">
                <p>
                  <Text text="製鉄工学・産業工学・電気電子メディアを専攻後、富士電機株式会社で産業用インバータのプロジェクトマネージャーとして従事しました。その後、ABB株式会社では北海道・新島（NEDO向け）の蓄電池プロジェクトを成功に導き、DENBA株式会社にて副社長・中国法人社長を経験。" />
                </p>
                <p>
                  <Text text="こうした現場での経験から確信したのは、「蓄電池の制御技術こそが、日本のエネルギー安全保障を左右する」ということです。2023年、国内最大のESSメーカーの設立を目指しPower CMSを創業しました。自社開発のBMS・EMSを核に、グリッドスケールから家庭用まで一気通貫のソリューションを提供するそのビジョンの実現に向け、チームとともに歩み続けます。" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
