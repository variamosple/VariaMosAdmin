import type { PagedModel } from "@variamosple/variamos-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

// The same parameters in any order give the same key
const keyOf = (params: URLSearchParams) =>
  [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("&");

const withoutPage = (params: URLSearchParams) => {
  const copy = new URLSearchParams(params);
  copy.delete("page");
  return keyOf(copy);
};

/**
 * The query string of the list page. restoreKey changes when the address
 * changes by itself (first load, back, forward, a pasted link), not when
 * write() changes it: the list then reloads, and its search form takes the
 * restored values (UX-26).
 */
export const useListParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const key = keyOf(searchParams);
  const params = useMemo(() => new URLSearchParams(key), [key]);
  const written = useRef(key);
  const [restoreKey, setRestoreKey] = useState(0);
  // write() stays the same function: a list effect that depends on it must
  // not run again, with the old filter, when the address changes by itself
  const latest = useRef({ params, setSearchParams });
  latest.current = { params, setSearchParams };

  useEffect(() => {
    if (key !== written.current) {
      written.current = key;
      setRestoreKey((count) => count + 1);
    }
  }, [key]);

  // A change of page adds a history entry, so that Back goes to the
  // previous page; a new search replaces the entry. A caller may choose.
  const write = useCallback(
    (next: URLSearchParams, history?: "push" | "replace") => {
      const nextKey = keyOf(next);
      if (nextKey === written.current) return;
      const { params: current, setSearchParams: setParams } = latest.current;
      const pageOnly = withoutPage(next) === withoutPage(current);
      written.current = nextKey;
      setParams(next, {
        replace: history ? history === "replace" : !pageOnly,
      });
    },
    [],
  );

  return { params, write, restoreKey };
};

/**
 * The query string of a filter: its own fields that have a value, and the
 * page from 2 on. The page size is not part of it.
 */
export const paramsOf = (filter: PagedModel): URLSearchParams => {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filter)) {
    if (name === "pageSize" || name === "pageNumber") continue;
    if (value === undefined || value === null || value === "") continue;
    params.set(name, String(value));
  }
  if (filter.pageNumber > 1) params.set("page", String(filter.pageNumber));
  return params;
};

/** Readers for a filter's fromParams. */
export const readParam = (params: URLSearchParams, name: string) =>
  params.get(name) || undefined;

export const readBooleanParam = (params: URLSearchParams, name: string) => {
  const value = params.get(name);
  return value === "true" ? true : value === "false" ? false : undefined;
};

export const readPage = (params: URLSearchParams) => {
  const page = Number.parseInt(params.get("page") ?? "", 10);
  // A missing or invalid page (NaN) is the first page
  return Number.isNaN(page) ? 1 : Math.max(page, 1);
};

interface PagedListState<Filter extends PagedModel> {
  filter: Filter | null;
  currentPage: number;
  loadData: (filter: Filter) => Promise<object>;
}

/**
 * Keeps a paged list and its address in step (UX-26): the list loads the
 * filter written in the address, and every search or page change is
 * written back. fromParams must be stable (a module function). Returns the
 * filter restored from the address, for the search form, and a key that
 * changes with it.
 */
export const useListQueryState = <Filter extends PagedModel>(
  { filter, currentPage, loadData }: PagedListState<Filter>,
  fromParams: (params: URLSearchParams) => Filter,
) => {
  const { params, write, restoreKey } = useListParams();
  // Read when the address was restored, not on each write
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Computed in the render where restoreKey changes, so that the search
  // form, remounted on that key, starts from it
  const restored = useMemo(() => {
    void restoreKey;
    return fromParams(paramsRef.current);
  }, [restoreKey, fromParams]);

  // One load per restored address
  useEffect(() => {
    void loadData(restored);
  }, [restored, loadData]);

  useEffect(() => {
    // currentPage is the trigger of a page change: the library changes the
    // page inside the same filter object
    void currentPage;
    if (filter) write(paramsOf(filter));
  }, [filter, currentPage, write]);

  return { restoredFilter: restored, restoreKey };
};
