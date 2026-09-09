import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndexDetailPage } from "@/components/pages/index-detail";
import { fetchOnchainIndex } from "@/lib/ens/indexes";
import { getAllIndexes, getIndexBySlug } from "@/lib/mock/indexes";

/** Records change only when a creator publishes, so a short window is enough. */
export const revalidate = 60;

interface IndexRouteProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllIndexes().map((index) => ({ slug: index.slug }));
}

export async function generateMetadata({
  params,
}: IndexRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const index = getIndexBySlug(slug);

  if (!index) {
    return { title: "Index not found" };
  }

  return {
    title: index.name,
    description: index.description,
    openGraph: { title: index.name, description: index.description },
  };
}

export default async function IndexRoute({ params }: IndexRouteProps) {
  const { slug } = await params;
  const index = getIndexBySlug(slug);

  if (!index) {
    notFound();
  }

  const onchain = await fetchOnchainIndex(slug).catch(() => null);

  return <IndexDetailPage index={index} onchain={onchain} />;
}
