import Breadcrumbs from "@/components/Breadcrumb";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import {
  PAGE_HERO_BREADCRUMB_CLASS,
  PAGE_HERO_BREADCRUMB_CURRENT_CLASS,
  PAGE_HERO_BREADCRUMB_LINK_CLASS,
  PAGE_HERO_BREADCRUMB_LIST_CLASS,
  PAGE_HERO_BREADCRUMB_SEPARATOR_CLASS,
  PAGE_HERO_CONTAINER_CLASS,
  PAGE_HERO_COPY_BLOCK_CLASS,
  PAGE_HERO_SUBTITLE_CLASS,
  PAGE_HERO_TITLE_CLASS,
} from "@/components/pageHeroStyles";

export default function NavPageHero({
  path,
  label,
  title,
  subtitle,
  labels,
  prependItems,
  containerClassName,
}: {
  path: string;
  label: string;
  title: string;
  subtitle: string;
  labels?: Record<string, string>;
  prependItems?: Array<{ path: string; label: string }>;
  containerClassName?: string;
}) {
  return (
    <BreadcrumbHero className="h-[240px] min-[768px]:h-[400px]">
      <div
        className={
          containerClassName
            ? `${PAGE_HERO_CONTAINER_CLASS} ${containerClassName}`
            : PAGE_HERO_CONTAINER_CLASS
        }
      >
        <Breadcrumbs
          className={PAGE_HERO_BREADCRUMB_CLASS}
          listClassName={PAGE_HERO_BREADCRUMB_LIST_CLASS}
          linkClassName={PAGE_HERO_BREADCRUMB_LINK_CLASS}
          currentClassName={PAGE_HERO_BREADCRUMB_CURRENT_CLASS}
          separatorClassName={PAGE_HERO_BREADCRUMB_SEPARATOR_CLASS}
          separator="›"
          labels={{ [path]: label, ...(labels ?? {}) }}
          prependItems={prependItems}
        />

        <div className={PAGE_HERO_COPY_BLOCK_CLASS}>
          <h1 className={PAGE_HERO_TITLE_CLASS}>
            {title}
          </h1>
          <p className={PAGE_HERO_SUBTITLE_CLASS}>
            {subtitle}
          </p>
        </div>
      </div>
    </BreadcrumbHero>
  );
}
