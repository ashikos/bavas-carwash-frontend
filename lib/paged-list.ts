"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "./api";

/**
 * Endless-scrolling list backed by a paged endpoint.
 *
 * The registers go back years and run to tens of thousands of rows. Fetching a
 * whole table sent megabytes and locked the browser for seconds building tens of
 * thousands of DOM nodes, so every list endpoint is paged and pulls in the next
 * page as its container nears the bottom.
 *
 * Attach the returned `listRef` to the element that actually scrolls.
 */

export const PAGE_SIZE = 50;

/** How close to the bottom, in pixels, before the next page is requested. */
const LOAD_AHEAD = 320;

export interface Page<T> {
  items: T[];
  total: number;
  has_more: boolean;
}

export function usePagedList<T>(
  queryKey: readonly unknown[],
  path: string,
  filters: Record<string, string | undefined> = {}
) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      initialPageParam: 0,
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(pageParam),
        });
        for (const [key, value] of Object.entries(filters)) {
          if (value) params.set(key, value);
        }
        return api.get<Page<T>>(`${path}?${params}`);
      },
      // The next offset is however many rows we already hold.
      getNextPageParam: (last, pages) =>
        last.has_more ? pages.reduce((n, p) => n + p.items.length, 0) : undefined,
    });

  const items = useMemo(() => (data?.pages ?? []).flatMap((p) => p.items), [data]);
  const total = data?.pages[0]?.total ?? 0;

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const check = () => {
      timer = null;
      if (!hasNextPage || isFetchingNextPage) return;
      if (node.scrollTop + node.clientHeight >= node.scrollHeight - LOAD_AHEAD) fetchNextPage();
    };
    const onScroll = () => {
      // Throttled with a timer rather than requestAnimationFrame, which does not
      // run while the tab is in the background — scrolling, switching away and
      // coming back would otherwise leave the list stuck.
      if (timer) return;
      timer = setTimeout(check, 80);
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    // A short first page may not fill the panel, leaving nothing to scroll;
    // top it up straight away.
    check();
    return () => {
      node.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  return { listRef, items, total, isLoading, isError, hasNextPage, isFetchingNextPage };
}
