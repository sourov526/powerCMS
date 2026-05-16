"use client";

import { useState } from "react";
import {
  LinkedinShareButton,
  TwitterShareButton,
} from "react-share";

type Props = {
  shareUrl: string;
  title: string;
  mediaUrl?: string;
};

const socialButtonClass =
  "inline-flex items-center justify-center gap-[11px] rounded-[8px] bg-[#252422] px-[24px] py-[8px] text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8A5A] focus-visible:ring-offset-2 max-[767px]:flex-1 max-[767px]:basis-0 max-[767px]:px-[12px]";
const copyButtonClass =
  "inline-flex items-center justify-center gap-[11px] rounded-[8px] border border-[#5A5955] bg-white px-[24px] py-[8px] text-[#252422] transition hover:bg-[#F8F8F8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8A5A] focus-visible:ring-offset-2 max-[767px]:flex-1 max-[767px]:basis-0 max-[767px]:px-[12px]";
const labelClass =
  "whitespace-nowrap font-noto-jp text-[16px] font-bold leading-[1.6] tracking-[0.8px] max-[767px]:text-[12px] max-[767px]:tracking-[0.6px]";

export default function ShareButtons({ shareUrl, title }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch {
        // Clipboard can be unavailable in some browsers/contexts.
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-[16px] max-[767px]:w-full max-[767px]:flex-nowrap">
      <TwitterShareButton
        url={shareUrl}
        title={title}
        resetButtonStyle={false}
        className={socialButtonClass}
        aria-label="Xでシェア"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 19"
          width="20"
          height="18.06"
          fill="none"
          className="h-[18.06px] w-[20px]"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.52323 9.90538L0.38009 18.0588H3.54442L9.01201 11.8014L13.8298 18.0601L20 18.0265L12.1771 7.68186L18.853 0.0348183L15.7395 0L10.6968 5.74698L6.38238 0.00938393L0 0.00245918L7.52323 9.90538ZM16.2631 16.182L14.6663 16.177L3.69567 1.81457H5.41329L16.2631 16.182Z"
            fill="currentColor"
          />
        </svg>
        <span className={labelClass}>シェア</span>
      </TwitterShareButton>

      <LinkedinShareButton
        url={shareUrl}
        title={title}
        resetButtonStyle={false}
        className={socialButtonClass}
        aria-label="LinkedInでシェア"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="h-[20px] w-[20px]"
          aria-hidden="true"
        >
          <path
            d="M3.95833 1.5625C3.48868 1.5625 3.03826 1.74907 2.70617 2.08117C2.37407 2.41326 2.1875 2.86368 2.1875 3.33333C2.1875 3.80299 2.37407 4.25341 2.70617 4.5855C3.03826 4.9176 3.48868 5.10417 3.95833 5.10417C4.42799 5.10417 4.87841 4.9176 5.2105 4.5855C5.5426 4.25341 5.72917 3.80299 5.72917 3.33333C5.72917 2.86368 5.5426 2.41326 5.2105 2.08117C4.87841 1.74907 4.42799 1.5625 3.95833 1.5625ZM2.29167 6.5625C2.26404 6.5625 2.23754 6.57347 2.21801 6.59301C2.19847 6.61254 2.1875 6.63904 2.1875 6.66667V17.5C2.1875 17.5575 2.23417 17.6042 2.29167 17.6042H5.625C5.65263 17.6042 5.67912 17.5932 5.69866 17.5737C5.71819 17.5541 5.72917 17.5276 5.72917 17.5V6.66667C5.72917 6.63904 5.71819 6.61254 5.69866 6.59301C5.67912 6.57347 5.65263 6.5625 5.625 6.5625H2.29167ZM7.70833 6.5625C7.68071 6.5625 7.65421 6.57347 7.63468 6.59301C7.61514 6.61254 7.60417 6.63904 7.60417 6.66667V17.5C7.60417 17.5575 7.65083 17.6042 7.70833 17.6042H11.0417C11.0693 17.6042 11.0958 17.5932 11.1153 17.5737C11.1349 17.5541 11.1458 17.5276 11.1458 17.5V11.6667C11.1458 11.2523 11.3105 10.8548 11.6035 10.5618C11.8965 10.2688 12.2939 10.1042 12.7083 10.1042C13.1227 10.1042 13.5202 10.2688 13.8132 10.5618C14.1062 10.8548 14.2708 11.2523 14.2708 11.6667V17.5C14.2708 17.5575 14.3175 17.6042 14.375 17.6042H17.7083C17.736 17.6042 17.7625 17.5932 17.782 17.5737C17.8015 17.5541 17.8125 17.5276 17.8125 17.5V10.3167C17.8125 8.29417 16.0542 6.7125 14.0417 6.895C13.4191 6.95212 12.8092 7.1062 12.2342 7.35167L11.1458 7.81833V6.66667C11.1458 6.63904 11.1349 6.61254 11.1153 6.59301C11.0958 6.57347 11.0693 6.5625 11.0417 6.5625H7.70833Z"
            fill="currentColor"
          />
        </svg>
        <span className={labelClass}>シェア</span>
      </LinkedinShareButton>

      <button
        type="button"
        className={copyButtonClass}
        onClick={handleCopy}
        aria-label={copied ? "コピーしました" : "URLコピー"}
        title={copied ? "コピーしました" : "URLコピー"}
      >
        <span className="inline-flex h-[20px] w-[20px] items-center justify-center">
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[11px] w-[11px]"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="block h-[20px] w-[20px]"
              aria-hidden="true"
            >
              <path
                d="M13.107 3.23633C14.302 2.03633 16.0504 2.01133 17.0179 2.983C17.9879 3.95633 17.962 5.71633 16.7654 6.91633L14.7462 8.94383C14.6325 9.06187 14.5697 9.21984 14.5714 9.38372C14.573 9.54759 14.639 9.70426 14.755 9.81998C14.8711 9.93571 15.028 10.0012 15.1918 10.0024C15.3557 10.0036 15.5135 9.94036 15.6312 9.82633L17.6512 7.79883C19.2437 6.19967 19.4437 3.64717 17.9037 2.1005C16.3621 0.553 13.8145 0.754667 12.2204 2.35383L8.18205 6.40967C6.58955 8.00883 6.38955 10.5613 7.92955 12.1072C7.98707 12.167 8.05592 12.2147 8.13209 12.2477C8.20826 12.2806 8.29023 12.298 8.3732 12.2989C8.45618 12.2998 8.53851 12.2842 8.61538 12.253C8.69226 12.2217 8.76214 12.1755 8.82096 12.1169C8.87977 12.0584 8.92634 11.9887 8.95795 11.912C8.98955 11.8353 9.00556 11.753 9.00504 11.6701C9.00453 11.5871 8.98749 11.505 8.95492 11.4287C8.92236 11.3524 8.87493 11.2833 8.81538 11.2255C7.84538 10.2522 7.87205 8.49217 9.06788 7.29217L13.107 3.23633Z"
                fill="currentColor"
              />
              <path
                d="M12.0706 7.89184C11.9534 7.77437 11.7944 7.70824 11.6285 7.70801C11.4626 7.70777 11.3035 7.77345 11.186 7.89059C11.0685 8.00772 11.0024 8.16673 11.0022 8.33262C11.0019 8.49851 11.0676 8.6577 11.1847 8.77517C12.1547 9.7485 12.1289 11.5077 10.9322 12.7085L6.89307 16.7635C5.69723 17.9635 3.9489 17.9885 2.9814 17.0168C2.0114 16.0435 2.03806 14.2835 3.2339 13.0835L5.2539 11.056C5.31184 10.9978 5.35777 10.9288 5.38904 10.8529C5.42032 10.777 5.43634 10.6957 5.43618 10.6136C5.43603 10.5315 5.4197 10.4502 5.38814 10.3744C5.35658 10.2986 5.3104 10.2298 5.25223 10.1718C5.19407 10.1139 5.12506 10.068 5.04915 10.0367C4.97323 10.0054 4.89191 9.9894 4.8098 9.98955C4.7277 9.98971 4.64643 10.006 4.57064 10.0376C4.49485 10.0692 4.42601 10.1153 4.36806 10.1735L2.34806 12.201C0.755565 13.801 0.555565 16.3527 2.09556 17.8993C3.63723 19.4477 6.18473 19.2452 7.7789 17.646L11.8181 13.5902C13.4106 11.9918 13.6106 9.43767 12.0706 7.89184Z"
                fill="currentColor"
              />
            </svg>
          )}
        </span>
        <span className={labelClass}>{copied ? "コピー済み" : "URLコピー"}</span>
      </button>
    </div>
  );
}
