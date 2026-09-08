import { Card } from "@/components/ui/Card";
import { getAllIndexes, getIndexBySlug } from "@/lib/mock/indexes";
import { SwapCard } from "./components/SwapCard";

interface SwapPageProps {
  indexSlug?: string;
}

export const SwapPage = ({ indexSlug }: SwapPageProps) => {
  const indexes = getAllIndexes();
  const index =
    (indexSlug ? getIndexBySlug(indexSlug) : undefined) ?? indexes[0];

  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-5">
        <SwapCard index={index} indexes={indexes} />
      </Card>
    </div>
  );
};
