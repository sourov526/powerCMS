import { Text } from "@/components/atoms/typography/Text";
import Image from "next/image";

type Director = {
  id: string;
  title: string;
  name: string;
  ruby: string;
  bio: string;
  imageSrc: string;
  imageAlt: string;
};

const DIRECTORS: Director[] = [
  {
    id: "okino-kyoichi",
    title: "代表取締役",
    name: "沖野 強一",
    ruby: "おきの　きょういち",
    bio: "富士電機株式会社・ABB株式会社を経て2023年Power CMS創業。第三種電気主任技術者・第一級陸上無線技術士保有。MBA。",
    imageSrc: "/images/company/company-information02.webp",
    imageAlt: "代表取締役プロフィール画像",
  },
  {
    id: "director-02",
    title: "役員",
    name: "氏名",
    ruby: "しめい",
    bio: "テキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキスト",
    imageSrc: "/images/company/company-information03.webp",
    imageAlt: "役員プロフィール画像",
  },
  {
    id: "director-03",
    title: "役員",
    name: "氏名",
    ruby: "しめい",
    bio: "テキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキスト",
    imageSrc: "/images/company/company-information02.webp",
    imageAlt: "役員プロフィール画像",
  },
];

export default function BoardOfDirectorsSection() {
  return (
    <section className="bg-brand-offwhite">
      <div className="container py-8 lg:py-20">
        <div className="flex flex-col gap-2 lg:gap-3">
          <div className="flex items-center gap-2">
            <span
              className="h-[2px] w-[20px] shrink-0 bg-[#1F8A5A]"
              aria-hidden="true"
            />
            <div className="font-inter text-[10px] font-bold uppercase leading-[1.6] tracking-[0.05em] text-[#1F8A5A] lg:text-[12px]">
              <Text text="BOARD OF DIRECTORS" />
            </div>
          </div>
          <div className="self-stretch font-noto-jp text-[20px] font-bold leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-[30px]">
            <Text text="役員一覧" />
          </div>
        </div>

        <div className="grid gap-8 pt-6 lg:pt-12 lg:grid-cols-3 lg:gap-8">
          {DIRECTORS.map((director) => (
            <article
              key={director.id}
              className="flex h-full flex-col overflow-hidden rounded-[4px] bg-white lg:w-[379.66px]"
            >
              <div className="mx-auto h-[240px] w-[342.66px] max-w-full bg-[#C4C4C4] lg:mx-0 lg:w-[379.66px]">
                <Image
                  src={director.imageSrc}
                  alt={director.imageAlt}
                  width={760}
                  height={480}
                  loading="lazy"
                  className="h-[240px] w-[342.66px] max-w-full object-cover lg:w-[379.66px]"
                  unoptimized
                />
              </div>

              <div className="flex flex-1 flex-col gap-4 px-4 py-5">
                <div className="flex flex-col">
                  <div className="font-noto-jp text-[10px] font-bold leading-[1.6] tracking-[0.05em] text-[#1F8A5A] lg:text-[12px]">
                    <Text text={director.title} />
                  </div>
                  <div className="pt-1 font-noto-jp text-[16px] font-bold leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-[22px]">
                    <Text text={director.name} />
                  </div>
                  <div className="font-noto-jp text-[10px] font-normal leading-[1.6] tracking-[0.05em] text-[#252422] lg:text-[12px]">
                    <Text text={director.ruby} />
                  </div>
                </div>

                <div className="rounded-[7px] bg-[#F0F7F7] p-3 lg:p-3">
                  <div className="font-noto-jp text-[14px] font-normal uppercase leading-[1.6] tracking-[0.7px] text-[#5A5955] lg:text-[16px] lg:tracking-[0.05em]">
                    <Text text={director.bio} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
