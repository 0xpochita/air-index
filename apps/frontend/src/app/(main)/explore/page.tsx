import type { Metadata } from "next";
import { ExplorePage } from "@/components/pages/explore";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Explore",
  description: SITE.description,
};

interface ExploreRouteProps {
  searchParams: Promise<{ page?: string; collection?: string }>;
}

export default async function ExploreRoute({
  searchParams,
}: ExploreRouteProps) {
  const { page, collection } = await searchParams;

  return <ExplorePage page={page} collection={collection} />;
}
