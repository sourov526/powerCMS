// data/nav.ts
export type NavItem = {
  id: string;
  label: string;
  href?: string;
  isExternal?: boolean;
  menuClicked?: boolean;
  children?: {
    id: string;
    label: string;
    href: string;
    isExternal?: boolean;
    device: "desktop" | "mobile" | "tablet" | "all";
  }[];
  device: "desktop" | "mobile" | "tablet" | "all";
};
export const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "home",
    href: "/",
    device: "mobile",
    isExternal: false,
    menuClicked: false,
  },
  {
    id: "services",
    label: "business.label",
    isExternal: false,
    menuClicked: true,
    children: [
      {
        id: "strength",
        label: "business.reputationCloud",
        href: "https://solution.brandcloud.co.jp/service/fuhyohigaicloud/",
        device: "all",
        isExternal: true,
      },
      {
        id: "board",
        label: "business.brandLifting",
        href: "https://solution.brandcloud.co.jp/service/brand-lifting/",
        device: "all",
        isExternal: true,
      },
      {
        id: "flame-prevention",
        label: "business.flamePreventionCloud",
        href: "https://solution.brandcloud.co.jp/service/enjouyoboucloud/",
        device: "all",
        isExternal: true,
      },
    ],
    device: "all",
  },
  {
    id: "products",
    label: "productsSolutions",
    href: "/products",
    device: "all",
    isExternal: false,
  },
  {
    id: "cases",
    label: "cases",
    href: "/cases",
    device: "all",
    isExternal: false,
  },
  {
    id: "company",
    label: "company.label",
    href: "/company",
    device: "all",
    isExternal: false,
  },
  {
    id: "ir",
    label: "ir",
    href: "/ir",
    device: "all",
    isExternal: false,
  },
  {
    id: "careers",
    label: "careers",
    href: "/recruit",
    device: "all",
    isExternal: false,
  },
  {
    id: "news",
    label: "news",
    href: "/category/news",
    device: "all",
    isExternal: false,
  },
];
