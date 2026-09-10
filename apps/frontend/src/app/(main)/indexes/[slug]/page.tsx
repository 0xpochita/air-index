import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndexDetailPage } from "@/components/pages/index-detail";
import { fetchOnchainIndex } from "@/lib/ens/indexes";
import { toLiveIndex } from "@/lib/onchain/vaults";

/** Records change only when someone publishes, so a short window is enough. */
export const revalidate = 60;

interface IndexRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: IndexRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const onchain = await fetchOnchainIndex(slug).catch(() => null);

  if (!onchain) {
    return { title: "Index not found" };
  }

  const index = toLiveIndex(onchain);

  return {
    title: index.name,
    description: index.description ?? undefined,
    openGraph: {
      title: index.name,
      description: index.description ?? undefined,
    },
  };
}

/**
 * Resolved, not looked up. An alias points at the same records as its target,
 * so `bg5` renders the index it mirrors rather than 404ing on a slug this app
 * happens not to know.
 */
export default async function IndexRoute({ params }: IndexRouteProps) {
  const { slug } = await params;
  const onchain = await fetchOnchainIndex(slug).catch(() => null);

  if (!onchain) {
    notFound();
  }

  return <IndexDetailPage index={toLiveIndex(onchain)} />;
}
