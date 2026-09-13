"use client";

/** The bottom of an endless-scrolling list: loading more, or the end of it. */
export function ListFooter({
  loaded,
  total,
  noun,
  nounPlural,
  isFetchingNextPage,
  hasNextPage,
  isLoading,
}: {
  loaded: number;
  total: number;
  noun: string;
  nounPlural: string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isLoading: boolean;
}) {
  if (isLoading) return null;

  if (isFetchingNextPage) {
    return <div className="text-sm text-text-muted px-1 py-4">Loading more…</div>;
  }
  if (!hasNextPage && loaded > 0) {
    return (
      <div className="text-[12.5px] text-text-muted px-1 py-4">
        That&rsquo;s all {total} {total === 1 ? noun : nounPlural}.
      </div>
    );
  }
  return null;
}

/** "Showing 50 of 1,937" while more remain, otherwise a plain count. */
export function ListCount({
  loaded,
  total,
  noun,
  nounPlural,
}: {
  loaded: number;
  total: number;
  noun: string;
  nounPlural: string;
}) {
  return (
    <div className="text-[12.5px] text-text-muted sm:ml-auto tabular-nums">
      {loaded < total
        ? `Showing ${loaded} of ${total}`
        : `${total} ${total === 1 ? noun : nounPlural}`}
    </div>
  );
}
