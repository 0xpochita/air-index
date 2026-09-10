import Link from "next/link";
import { cn } from "@/lib/cn";

const LINK_CLASS =
  "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-out";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  /** Built by the caller so filters survive a page change. */
  pageHref: (page: number) => string;
}

export const TablePagination = ({
  currentPage,
  totalPages,
  pageHref,
}: TablePaginationProps) => {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Index table pages"
      className="flex items-center justify-end gap-3 px-4 py-4 text-ink-muted"
    >
      {hasPrevious ? (
        <Link
          href={pageHref(currentPage - 1)}
          className={cn(LINK_CLASS, "hover:text-ink")}
        >
          Previous
        </Link>
      ) : (
        <span className={cn(LINK_CLASS, "text-ink-subtle")}>Previous</span>
      )}

      <span className="text-sm tabular-nums">{`${currentPage} of ${totalPages}`}</span>

      {hasNext ? (
        <Link
          href={pageHref(currentPage + 1)}
          className={cn(LINK_CLASS, "hover:text-ink")}
        >
          Next
        </Link>
      ) : (
        <span className={cn(LINK_CLASS, "text-ink-subtle")}>Next</span>
      )}
    </nav>
  );
};
