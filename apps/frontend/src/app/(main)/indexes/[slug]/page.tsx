import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndexDetailPage } from "@/components/pages/index-detail";
import { getAllIndexes, getIndexBySlug } from "@/lib/mock/indexes";

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

  return <IndexDetailPage index={index} />;
}
