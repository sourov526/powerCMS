import { Text } from "@/components/atoms/typography/Text";

type CompanyInfoItem = {
  label: string;
  value: string;
};

const COMPANY_INFO: CompanyInfoItem[] = [
  { label: "商号", value: "Power CMS株式会社" },
  { label: "設立", value: "2023年12月1日" },
  { label: "資本金", value: "351百万円（2025年8月末時点、資本準備金含む）" },
  {
    label: "所在地",
    value: "〒105-0003 東京都港区西新橋1-13-5 登栄西新橋ビル3F",
  },
  { label: "代表取締役", value: "沖野 強一（おきの きょういち）" },
  {
    label: "事業内容",
    value:
      "蓄電池を含む再生可能エネルギーシステムのインテグレーション及びサービス展開",
  },
  { label: "URL", value: "https://powercms.co.jp/" },
  { label: "電話番号", value: "03-6824-6777" },
  { label: "メールアドレス", value: "info@powercms.co.jp" },
];

export default function CompanyOverviewSection() {
  return (
    <section className="bg-[#F4F4F2]">
      <div className="container py-8 lg:py-20">
        <div className="flex flex-col gap-6 lg:gap-10">
          <div className="flex flex-col gap-2 lg:gap-3">
            <div className="flex items-center gap-2">
              <span
                className="h-[2px] w-[20px] shrink-0 bg-[#1F8A5A]"
                aria-hidden="true"
              />
              <div className="font-inter text-[10px] font-bold uppercase leading-[1.6] tracking-[0.05em] text-[#1F8A5A] lg:text-[12px]">
                <Text text="COMPANY OVERVIEW" />
              </div>
            </div>
            <div className="font-noto-jp text-[20px] font-bold leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-[30px]">
              <Text text="会社概要" />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:gap-3">
            {COMPANY_INFO.map((item) => (
              <dl
                key={item.label}
                className="grid gap-3 lg:grid-cols-[208px_minmax(0,1fr)] lg:items-stretch lg:gap-6"
              >
                <dt className="inline-flex h-[38px] w-fit items-center justify-center whitespace-nowrap rounded-[8px] bg-[#1F8A5A] px-4 py-2 font-noto-jp text-[14px] font-bold leading-[1.6] tracking-[0.05em] text-white lg:h-[50px] lg:w-[208px] lg:justify-start lg:bg-[#24925E] lg:px-6 lg:py-3 lg:text-[16px] lg:leading-[1.6]">
                  <Text text={item.label} />
                </dt>
                <dd className="w-full min-w-0 rounded-[8px] bg-[#FFFFFF] px-4 py-2 font-noto-jp text-[14px] font-normal leading-[1.6] tracking-[0.02em] text-[#252422] lg:flex lg:min-h-[50px] lg:items-center lg:px-6 lg:py-3 lg:text-[16px] lg:tracking-[0.05em]">
                  {item.label === "所在地" ? (
                    <span className="block w-full">
                      <span className="block lg:hidden">
                        <Text text="〒105-0003" className="block" />
                        <Text
                          text="東京都港区西新橋1-13-5 登栄西新橋ビル3F"
                          className="block whitespace-nowrap"
                        />
                      </span>
                      <span className="hidden lg:block whitespace-nowrap">
                        <Text text="〒105-0003 東京都港区西新橋1-13-5 登栄西新橋ビル3F" />
                      </span>
                    </span>
                  ) : (
                    <span
                      className={
                        item.label === "資本金"
                          ? "block w-full whitespace-nowrap"
                          : ""
                      }
                    >
                      <Text
                        text={item.value}
                        className={
                          item.label === "資本金"
                            ? "block w-full whitespace-nowrap"
                            : ""
                        }
                      />
                    </span>
                  )}
                </dd>
              </dl>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
