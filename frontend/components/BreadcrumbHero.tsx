import { ReactNode } from "react";

const BREADCRUMB_BG_IMAGE_PC = "/images/Bread_Crumb/breadcrumb_pc.webp";
const BREADCRUMB_BG_IMAGE_MOBILE = "/images/Bread_Crumb/breadcrumb_mobile.webp";

export default function BreadcrumbHero({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "relative overflow-hidden mt-[68px] min-[768px]:mt-0 md:pt-[128px] lg:pt-[164px]",
        className ?? "",
      ].join(" ")}
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center mobile:block lg:hidden"
          style={{ backgroundImage: `url('${BREADCRUMB_BG_IMAGE_MOBILE}')` }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center mobile:hidden lg:block"
          style={{ backgroundImage: `url('${BREADCRUMB_BG_IMAGE_PC}')` }}
        />
      </div>

      <div className="relative h-full">{children}</div>
    </section>
  );
}
