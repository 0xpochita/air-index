import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAllIndexes, getIndexBySlug } from "@/lib/mock/indexes";
import { SwapArtPanel } from "./components/SwapArtPanel";
import { SwapCard } from "./components/SwapCard";

interface SwapPageProps {
  indexSlug?: string;
}

export const SwapPage = ({ indexSlug }: SwapPageProps) => {
  const indexes = getAllIndexes();
  const index =
    (indexSlug ? getIndexBySlug(indexSlug) : undefined) ?? indexes[0];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Swap into an index"
        description="Trade any supported asset for a whole crypto index in a single transaction."
        action={
          <ButtonLink href="/explore" variant="secondary">
            Browse indexes
          </ButtonLink>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <SwapArtPanel />
        <Card className="p-5">
          <SwapCard index={index} indexes={indexes} />
        </Card>
      </div>
    </div>
  );
};
