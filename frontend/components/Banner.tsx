import Breadcrumbs from "./Breadcrumb";
import { Text } from "./atoms/typography/Text";

type BannerPageProps = {
  japaneseTitle?: string;
  EnglishTitle: string;
  locale?: string;
};

export function Banner({ japaneseTitle, EnglishTitle }: BannerPageProps) {
  return (
    <main className="w-full">
      <section
        className="h-37.5 md:h-55 lg:h-76.75 top-0 w-full bg-cover bg-center flex"
        style={{ backgroundImage: "url(/images/banner-default.webp)" }}
      >
        <div className="container flex flex-col h-full justify-end  items-center md:items-start ">
          {japaneseTitle && (
            <Text
              text={japaneseTitle}
              className={` font-noto-jp block text-[14px] md:text-[16px] lg:text-[20px] leading-[1.2] font-black text-ink`}
            />
          )}
          <Text
            text={EnglishTitle}
            className={` text-[40px] md:text-[48px] lg:text-[64px] text-primary font-bold font-noto-jp leading-[1.2] tracking-wider pb-4 md:pb-2 lg:pb-3`}
          />
        </div>
      </section>

      <div className="w-full container pt-4  px-4 md:px-8 lg:px-0 pb-6 md:pb-16 lg:pb-25">
        <Breadcrumbs />
      </div>
    </main>
  );
}
