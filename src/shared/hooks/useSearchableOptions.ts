import {
  type ResponseModel,
  useDebouncedValue,
} from "@variamosple/variamos-components";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SelectOptionProps } from "@/shared/components/InfiniteSelect/index.types";

const SEARCH_DELAY_MS = 500;

interface OptionsRequest {
  search: string;
  page: number;
}

interface ShownOptions<Value> extends OptionsRequest {
  options: SelectOptionProps<Value>[];
  /** Matching items on the server; no more pages once all are shown */
  total: number;
}

const sameRequest = (a: OptionsRequest, b: OptionsRequest) =>
  a.search === b.search && a.page === b.page;

export interface SearchableOptionsSource<Item, Value> {
  /** Must be stable: a module function, or one kept by useCallback. */
  query: (search: string, page: number) => Promise<ResponseModel<Item[]>>;
  /** Must be stable too. */
  toOption: (item: Item) => SelectOptionProps<Value>;
}

/**
 * The options of a searchable InfiniteSelect, loaded a page at a time as
 * the last one comes into view. A new search starts again from its first
 * page and replaces the list, and an answer to an older search is dropped:
 * otherwise a search after scrolling asked for a later page of its results
 * and kept the previous list.
 */
export const useSearchableOptions = <Item, Value>({
  query,
  toOption,
}: SearchableOptionsSource<Item, Value>) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [search] = useDebouncedValue<string>(searchValue, SEARCH_DELAY_MS);
  const [request, setRequest] = useState<OptionsRequest>({
    search: "",
    page: 1,
  });
  const [shown, setShown] = useState<ShownOptions<Value>>({
    search: "",
    page: 0,
    options: [],
    total: 0,
  });

  useEffect(() => {
    setRequest((current) =>
      current.search === search && current.page === 1
        ? current
        : { search, page: 1 },
    );
  }, [search]);

  useEffect(() => {
    let current = true;
    const show = (items: Item[], total?: number) =>
      setShown((previous) => {
        const added = items.map(toOption);
        const options =
          request.page === 1 ? added : [...previous.options, ...added];
        return { ...request, options, total: total ?? options.length };
      });
    query(request.search, request.page)
      .then((response) => {
        if (!current) return;
        // A failed page ends the list rather than asking again and again
        if (response.errorCode) show([]);
        else show(response.data ?? [], response.totalCount);
      })
      .catch(() => {
        if (current) show([]);
      });
    return () => {
      current = false;
    };
  }, [request, query, toOption]);

  const isFetching = !sameRequest(shown, request);
  // Read by the observer, which outlives the render that made it
  const shownNow = useRef(shown);
  shownNow.current = shown;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastOptionRef = useCallback((node: Element | null) => {
    observer.current?.disconnect();
    if (!node) return;
    observer.current = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      const last = shownNow.current;
      // The next page only of the list on screen, and only if it has one:
      // a page asked meanwhile, or a new search, comes first
      setRequest((current) =>
        sameRequest(current, last) && last.options.length < last.total
          ? { ...current, page: current.page + 1 }
          : current,
      );
    });
    observer.current.observe(node);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  const onSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    setSearchValue(text);
  }, []);

  /** Shows the chosen label, and the whole list when opened again. */
  const onOptionChosen = useCallback((option: SelectOptionProps<Value>) => {
    setSearchInput(option.label);
    setSearchValue("");
  }, []);

  return {
    options: shown.options,
    isFetching,
    lastOptionRef,
    searchInput,
    onSearchChange,
    onOptionChosen,
  };
};
