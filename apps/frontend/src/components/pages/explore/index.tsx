import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getAllIndexes,
  getCollections,
  getFeaturedIndex,
} from "@/lib/mock/indexes";
import { CollectionCard } from "./components/CollectionCard";
import { FeaturedIndexCard } from "./components/FeaturedIndexCard";
import { IndexTable } from "./components/IndexTable";
import { TablePagination } from "./components/TablePagination";

const ROWS_PER_PAGE = 8;
const EXPLORE_PATH = "/explore";

const resolvePage = (
  rawPage: string | undefined,
  totalPages: number,
): number => {
  const parsed = Number(rawPage);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, totalPages);
};

interface ExplorePageProps {
  page?: string;
}

export const ExplorePage = ({ page }: ExplorePageProps) => {
  const indexes = getAllIndexes();
  const collections = getCollections();
  const featured = getFeaturedIndex();

  const totalPages = Math.max(1, Math.ceil(indexes.length / ROWS_PER_PAGE));
  const currentPage = resolvePage(page, totalPages);
  const visibleIndexes = indexes.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Explore"
        description="Crypto index funds published as ENS names. Every allocation is readable onchain."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <FeaturedIndexCard index={featured} />
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Highest total deposits" />
        {visibleIndexes.length > 0 ? (
          <>
            <IndexTable indexes={visibleIndexes} />
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={EXPLORE_PATH}
            />
          </>
        ) : (
          <EmptyState
            title="No indexes yet"
            description="Nothing has been published under the protocol root. Create the first index to get started."
          />
        )}
      </Card>
    </div>
  );
};
