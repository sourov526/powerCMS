"use client";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "@/utils/strings/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Text } from "../components/atoms/typography/Text";

const LandingPageHero = () => {
  const t = useTranslations("HomePage.hero");
  const locale = useLocale();
  const isEnglish = locale === "en";

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 375px)");

    const update = () => {
      setIsMobile(mqMobile.matches);
    };
    update();
    mqMobile.addEventListener("change", update);

    return () => {
      mqMobile.removeEventListener("change", update);
    };
  }, []);

  const heroImage = isMobile
    ? "/images/hero-tablet.webp"
    : "/images/hero-pc.webp";

  const stickerImage = "/images/hero-pc-mobile-sticker.png";
  const headerImage =
    locale === "ja"
      ? "/images/hero-japanese-header.png"
      : "/images/hero-english-header.png";
  const oldMan = isMobile
    ? "/images/hero-human-mobile.png"
    : "/images/hero-human.png";
  const grad = "linear-gradient(90deg, #F2635F 39.34%, #FFE043 68.65%)";
  return (
    <section
      className="h-190 md:h-256 lg:h-170  relative w-full bg-cover bg-center bg-no-repeat -mt-6.75 md:mt-0"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="hiro-container relative h-full">
        {/* old man */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-0 ">
          <Image
            src={oldMan}
            width={1000}
            height={1000}
            className=" h-107.75 min-w-85.25 max-w-85.25 md:h-151.5 md:min-w-137.75 md:max-w-137.75 lg:h-140 lg:min-w-134 lg:max-w-134 "
            alt={t("heroHumanAlt")}
          />
        </div>
        {/* Button */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 md:translate-x-0 lg:translate-x-0 ${
            locale === "en"
              ? "bottom-20.75 md:bottom-30  left-1/2  md:left-24 lg:left-10"
              : "md:left-55.75 md:translate-x-0  lg:left-9.75 bottom-[52.5px] md:bottom-20 lg:bottom-11.75"
          }`}
        >
          <Link href="/contact">
            <button
              type="button"
              className={`cursor-pointer items-center rounded-xl justify-center px-10 md:px-19 py-3 md:py-4 lg:px-15 text-ink ${
                isEnglish ? "flex gap-4" : "flex flex-col"
              }`}
              style={{
                backgroundImage:
                  "linear-gradient(177deg, #FFE043 7.13%, #F2635F 127.96%)",
              }}
            >
              <div className="flex flex-col items-center">
                <span
                  className={`whitespace-nowrap ${
                    isEnglish
                      ? "text-[20px] md:text-[32px] lg:text-[36px] font-black leading-normal"
                      : "text-[20px] md:text-[24px] lg:text-[26px] font-medium"
                  }`}
                >
                  {t("ctaTop")}
                </span>
                <span className=" whitespace-nowrap text-[24px] md:text-[32px] lg:text-[36px] font-black">
                  {t("ctaBottom")}
                </span>
              </div>
              {isEnglish && (
                <svg
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  className="h-8 w-8 md:h-9 md:w-9 lg:h-10 lg:w-10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M28.5802 16.682V7.362L37.5202 16.682H28.5802ZM29.5602 4.5H7.66016V43.5H40.3402V15.74L29.5602 4.5Z"
                    fill="#252422"
                  />
                </svg>
              )}
            </button>
          </Link>
        </div>
        {/* Sticker */}
        {locale === "ja" && (
          <div className="absolute right-4 left-auto md:left-14.5  lg:left-129 md:right-auto bottom-39.25 md:bottom-48.75 lg:bottom-9.75 ">
            <Image
              src={stickerImage}
              width={400}
              height={400}
              className="w-32.75 md:w-auto h-27.25 md:h-37.5 lg:h-41 "
              alt={t("heroStickerAlt")}
            />
          </div>
        )}

        {/*  absolute text block */}
        <Text
          text={t("caption")}
          className={`font-normal text-[#FAFAFA] text-[14px] md:text-[16px] absolute bottom-4
             lg:bottom-1.5  lg:right-0 ${
               isEnglish
                 ? "right-7.25 md:right-15"
                 : "right-17.5 md:right-33.25"
             }`}
        />

        <div className="flex flex-col pt-30.75 md:pt-26 lg:pt-28 gap-13.5 md:gap-8 lg:gap-9.5  ">
          {/* japanese header img */}
          <Image
            src={headerImage}
            width={400}
            height={400}
            className="h-16.5 md:h-29.5 lg:h-33.5 object-contain w-full md:w-137.5 self-center lg:self-auto lg:w-156 "
            alt={t("heroHeaderAlt")}
          />
          {/* Text */}
          <div className="flex flex-col gap-2 tracking-0">
            {isEnglish ? (
              <p className="text-[#FAFAFA] text-[28px] md:text-[48px] lg:text-[60px] font-black self-center lg:self-auto">
                {t("headline1Prefix")}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: grad }}
                >
                  {t("headline1Decade")}
                </span>
                {t("headline1Suffix")}
              </p>
            ) : (
              <Text
                text={t("headline1")}
                className="text-[#FAFAFA] text-[18px] md:text-[32px] lg:text-[42px] font-black self-center lg:self-auto"
              />
            )}
            <p
              className={`text-[#FAFAFA] font-black self-center lg:self-auto ${
                isEnglish
                  ? "text-[28px] md:text-[48px] lg:text-[60px]"
                  : "text-[18px] md:text-[32px] lg:text-[42px]"
              }`}
            >
              {isEnglish ? (
                <>
                  {t("headline2PrefixEn")}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: grad }}
                  >
                    {t("headline2Lose")}
                  </span>
                  {t("headline2SuffixEn")}
                </>
              ) : (
                <>
                  {t("headline2Prefix")}
                  <span
                    className="bg-clip-text text-transparent text-[22.4px] md:text-[32px] lg:text-[56px]"
                    style={{ backgroundImage: grad }}
                  >
                    {t("headline2Speed")}
                  </span>
                  {t("headline2Middle")}
                  <span
                    className="bg-clip-text text-transparent text-[22.4px] md:text-[32px] lg:text-[56px]"
                    style={{ backgroundImage: grad }}
                  >
                    {t("headline2Strategy")}
                  </span>
                  {t("headline2Suffix")}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPageHero;
