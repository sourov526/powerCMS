import { Text } from "@/components/atoms/typography/Text";
import Image from "next/image";

type CompanyHistoryItem = {
  id: number;
  year: string;
  detail: string;
  iconSrc: string;
};

const COMPANY_HISTORY: CompanyHistoryItem[] = [
  {
    id: 1,
    year: "2023年12月",
    detail: "Power CMS株式会社 設立（東京都文京区）",
    iconSrc: "/images/icon/companyHistory/history01.svg",
  },
  {
    id: 2,
    year: "2024年5月",
    detail: "資本金を1,000千円から51,000千円に増資",
    iconSrc: "/images/icon/companyHistory/history02-04-08.svg",
  },
  {
    id: 3,
    year: "2024年7月",
    detail: "ELMO TECH Co., Ltd.とタイ国内における業務提携を締結",
    iconSrc: "/images/icon/companyHistory/history03.svg",
  },
  {
    id: 4,
    year: "2024年11月",
    detail: "資本金を51,000千円から126,000千円に増資",
    iconSrc: "/images/icon/companyHistory/history02-04-08.svg",
  },
  {
    id: 5,
    year: "2024〜2025年",
    detail:
      "BESS EXPO出展、YouTube公開、レドックスフロー模型展示など広報活動開始",
    iconSrc: "/images/icon/companyHistory/history05.svg",
  },
  {
    id: 6,
    year: "2025年6月",
    detail: "系統用蓄電池システムの受注を獲得",
    iconSrc: "/images/icon/companyHistory/history06-07.svg",
  },
  {
    id: 7,
    year: "2025年7月",
    detail: "マイクログリッド蓄電池システムの受注を獲得",
    iconSrc: "/images/icon/companyHistory/history06-07.svg",
  },
  {
    id: 8,
    year: "2025年8月",
    detail: "資本金を176,000千円から351,000千円（準備金含む）に増資",
    iconSrc: "/images/icon/companyHistory/history02-04-08.svg",
  },
  {
    id: 9,
    year: "2026年3月",
    detail: "埼玉県熊谷市・上奈良蓄電所（5MWh）商業稼働開始",
    iconSrc: "/images/icon/companyHistory/history09-10.svg",
  },
  {
    id: 10,
    year: "2026年3月",
    detail: "埼玉県上里町・七本木蓄電所（5MWh）電力受電完了",
    iconSrc: "/images/icon/companyHistory/history09-10.svg",
  },
];

export default function CompanyHistorySection() {
  return (
    <section className="rounded-t-[20px] lg:rounded-t-[40px] bg-[#E4E3DF]">
      <div className="container py-8 lg:py-20">
        <div className="flex flex-col gap-6 lg:gap-12">
          <div className="flex flex-col gap-2 lg:gap-3">
            <div className="flex items-center gap-2">
              <span
                className="h-[2px] w-[20px] shrink-0 bg-[#1F8A5A]"
                aria-hidden="true"
              />
              <div className="font-inter text-[10px] font-bold uppercase leading-[1.6] tracking-[0.05em] text-[#1F8A5A] lg:text-[12px]">
                <Text text="COMPANY HISTORY" />
              </div>
            </div>

            <div className="self-stretch font-noto-jp text-[20px] font-bold leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-left lg:text-[30px]">
              <Text text="沿革" />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_377px] lg:gap-12 lg:items-stretch">
            <div>
              <ol className="flex flex-col gap-0 lg:gap-0">
                {COMPANY_HISTORY.map((item, index) => (
                  <li
                    key={`${item.id}-${item.year}-${item.detail}`}
                    className="relative grid min-h-[104px] grid-cols-[64px_minmax(0,1fr)] items-start gap-6 last:min-h-[64px] lg:min-h-[112px] lg:last:min-h-[72px] lg:grid-cols-[72px_minmax(0,1fr)] lg:gap-16"
                  >
                    <div className="relative h-16 w-16 rounded-[36px] bg-white p-5 text-[#1F8A5A] ring-2 ring-inset ring-[#1F8A5A] lg:h-[72px] lg:w-[72px] lg:rounded-full lg:p-[22px]">
                      <Image
                        src={item.iconSrc}
                        alt=""
                        width={28}
                        height={28}
                        loading="lazy"
                        className="h-6 w-6 shrink-0 aspect-square object-contain lg:h-7 lg:w-7"
                        aria-hidden="true"
                        unoptimized
                      />

                      <span className="absolute right-[-2.37px] top-[3.19px] flex h-[19.556px] w-[19.556px] items-center justify-center rounded-[11px] bg-[#1F8A5A] font-inter text-[11px] font-extrabold leading-[19.25px] text-white lg:-right-[6px] lg:top-0 lg:h-[22px] lg:w-[22px] lg:rounded-full">
                        <Text text={`${item.id}`} />
                      </span>
                    </div>

                    {index < COMPANY_HISTORY.length - 1 ? (
                      <span className="absolute bottom-0 left-[31px] top-16 w-[2px] bg-[#1F8A5A] lg:bottom-auto lg:left-[35px] lg:top-[72px] lg:h-10" />
                    ) : null}

                    <div className="-mt-1 flex min-w-0 flex-col gap-1 pt-0 lg:mt-0 lg:gap-2 lg:pt-[3px]">
                      <div className="font-noto-jp text-[14px] font-bold leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-[16px]">
                        <Text text={item.year} />
                      </div>
                      <div className="font-noto-jp text-[14px] font-normal leading-[1.6] tracking-[0.05em] text-[#5A5955] lg:text-[16px] lg:whitespace-nowrap">
                        <Text text={item.detail} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col gap-8 lg:h-full lg:justify-center lg:gap-12">
              <div className="overflow-hidden rounded-[8px] bg-[rgba(255,255,255,0.70)]">
                <Image
                  src="/images/company/company-information02.webp"
                  alt="オフィス風景"
                  width={754}
                  height={1000}
                  loading="lazy"
                  className="h-[240px] w-[343px] max-w-full shrink-0 object-cover lg:h-[500px] lg:w-full"
                  unoptimized
                />
              </div>
              <div className="overflow-hidden rounded-[8px] bg-[rgba(255,255,255,0.70)]">
                <Image
                  src="/images/company/company-information03.webp"
                  alt="プロジェクト建屋イメージ"
                  width={754}
                  height={1000}
                  loading="lazy"
                  className="h-[240px] w-[343px] max-w-full shrink-0 object-cover lg:h-[500px] lg:w-full"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
