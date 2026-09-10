export interface NavItem {
  href: string;
  label: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explore", label: "Explore" },
  { href: "/swap", label: "Swap" },
  { href: "/create", label: "Create" },
  { href: "/portfolio", label: "Portfolio" },
];

export const indexHref = (slug: string): string => `/indexes/${slug}`;

export const swapHref = (slug: string): string => `/swap?index=${slug}`;
