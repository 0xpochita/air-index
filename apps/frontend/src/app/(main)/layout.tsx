import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PortfolioProvider } from "@/lib/onchain/PortfolioProvider";
import { fetchLiveIndexes } from "@/lib/onchain/vaults";
import { WalletProvider } from "@/lib/onchain/WalletProvider";

/** Registry events and resolver records only change when someone publishes. */
export const revalidate = 60;

interface MainLayoutProps {
  children: ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  /**
   * Resolved on the server so the client never pays for a registry log scan
   * plus one universal resolver round trip per index before it can render.
   */
  const liveIndexes = await fetchLiveIndexes().catch(() => []);

  return (
    <WalletProvider>
      <PortfolioProvider liveIndexes={liveIndexes}>
        <AppShell>{children}</AppShell>
      </PortfolioProvider>
    </WalletProvider>
  );
}
