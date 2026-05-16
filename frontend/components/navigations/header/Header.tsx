import Image from "next/image";
import Link from "next/link";

export default function Header({
  spacer,
  position = "absolute",
}: {
  locale?: string;
  spacer?: boolean;
  position?: "fixed" | "absolute";
}) {
  return (
    <>
      <header id="header">
        <nav
          className={[
            position === "fixed" ? "fixed" : "absolute",
            "top-0 left-0 right-0 z-50 bg-white/95 border-b border-[#e5e5e5]",
          ].join(" ")}
        >
          <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between px-4 md:px-8 lg:px-20">
            <Link href="/" aria-label="Power CMS">
              <Image
                alt="Power CMS"
                src="/power-cms-logo.svg"
                width={210}
                height={60}
                className="h-[44px] w-auto"
                priority
              />
            </Link>
            <Link
              href="/admin"
              className="rounded border border-[#1F8A5A] px-4 py-2 text-sm font-semibold text-[#1F8A5A]"
            >
              Admin
            </Link>
          </div>
        </nav>
      </header>
      {spacer ?? position === "fixed" ? (
        <div className="h-[72px] site-header-spacer" />
      ) : null}
    </>
  );
}
