import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsLeftRightIcon,
  ChatCircleDotsIcon,
  CompassIcon,
  GearSixIcon,
  HouseIcon,
  LifebuoyIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: HouseIcon },
  { href: "/explore", label: "Explore", icon: CompassIcon },
  { href: "/swap", label: "Swap", icon: ArrowsLeftRightIcon },
  { href: "/create", label: "Create", icon: PlusCircleIcon },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: GearSixIcon },
  { href: "/help", label: "Help", icon: LifebuoyIcon },
  { href: "/feedback", label: "Feedback", icon: ChatCircleDotsIcon },
];

export const indexHref = (slug: string): string => `/indexes/${slug}`;

export const swapHref = (slug: string): string => `/swap?index=${slug}`;
