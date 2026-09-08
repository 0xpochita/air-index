import type { Metadata } from "next";
import { SwapPage } from "@/components/pages/swap";

export const metadata: Metadata = {
  title: "Swap",
  description:
    "Deposit, swap and redeem Air Index ETF units against any supported asset.",
};

interface SwapRouteProps {
  searchParams: Promise<{ index?: string }>;
}

export default async function SwapRoute({ searchParams }: SwapRouteProps) {
  const { index } = await searchParams;

  return <SwapPage indexSlug={index} />;
}
