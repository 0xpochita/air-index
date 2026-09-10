import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { listPublishedSlugs } from "@/lib/ens/indexes";
import { getAllIndexes, getCollections } from "@/lib/mock/indexes";
import type { IndexFund } from "@/types/index-fund";
import { CollectionTile } from "./components/CollectionTile";
import { IndexTable } from "./components/IndexTable";
import { TablePagination } from "./components/TablePagination";

const ROWS_PER_PAGE = 8;
const ALL_ID = "all";

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
  collection?: string;
}

export const ExplorePage = async ({ page, collection }: ExplorePageProps) => {
  const indexes = getAllIndexes();
  const liveSlugs = new Set(await listPublishedSlugs().catch(() => []));

  const tiles = [
    { id: ALL_ID, title: "All indexes", indexes },
    ...getCollections().map((entry) => ({
      id: entry.id,
      title: entry.title,
      indexes: entry.indexes,
    })),
  ];

  const activeId = tiles.some((tile) => tile.id === collection)
    ? (collection as string)
    : ALL_ID;
  const active = tiles.find((tile) => tile.id === activeId) ?? tiles[0];

  /** Live first: a name anyone can resolve outranks one that only exists here. */
  const rows: IndexFund[] = [...active.indexes].sort((first, second) => {
    const liveDelta =
      Number(liveSlugs.has(second.slug)) - Number(liveSlugs.has(first.slug));
    return liveDelta !== 0 ? liveDelta : first.name.localeCompare(second.name);
  });

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = resolvePage(page, totalPages);
  const visible = rows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  const tileHref = (id: string) =>
    id === ALL_ID ? "/explore" : `/explore?collection=${id}`;
  const pageHref = (next: number) =>
    activeId === ALL_ID
      ? `/explore?page=${next}`
      : `/explore?collection=${activeId}&page=${next}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore"
        description="Crypto index funds published as ENS names. Every allocation is readable onchain."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <CollectionTile
            key={tile.id}
            href={tileHref(tile.id)}
            title={tile.title}
            indexes={tile.indexes}
            isActive={tile.id === activeId}
          />
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title={active.title}
          action={
            <span className="text-xs text-ink-subtle">
              {`${liveSlugs.size} live on Sepolia`}
            </span>
          }
        />
        {visible.length > 0 ? (
          <>
            <IndexTable indexes={visible} liveSlugs={liveSlugs} />
            {totalPages > 1 ? (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageHref={pageHref}
              />
            ) : null}
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
