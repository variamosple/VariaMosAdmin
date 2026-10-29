import {
  type ResponseModel,
  usePaginatedQuery,
} from "@variamosple/variamos-components";
import { useCallback, useEffect, useState } from "react";
import type { PagedModel } from "@/shared/domain/Entity/PagedModel";

/**
 * One page of a journal at a time, reloaded on each search. The error is
 * shown in the page, since an empty journal and a failed read look alike.
 * Both arguments must be stable (module functions): they are dependencies.
 */
export const useJournal = <Filter extends PagedModel, Entry>(
  queryFunction: (filter: Filter) => Promise<ResponseModel<Entry[]>>,
  initialFilter: () => Filter,
) => {
  const [error, setError] = useState<string>();
  const query = useCallback(
    (filter: Filter) =>
      queryFunction(filter).then((response) => {
        setError(
          response.errorCode
            ? response.message || "The journal could not be read."
            : undefined,
        );
        return response;
      }),
    [queryFunction],
  );
  const {
    data: entries,
    loadData,
    currentPage,
    totalPages,
    totalItems,
    isLoading,
    onPageChange,
  } = usePaginatedQuery<Filter, Entry>({
    queryFunction: query,
    initialFilter: initialFilter(),
  });

  const search = useCallback(
    (filter: Filter) => {
      void loadData(filter);
    },
    [loadData],
  );

  useEffect(() => {
    search(initialFilter());
  }, [search, initialFilter]);

  return {
    entries,
    error,
    currentPage,
    totalPages,
    totalItems,
    isLoading,
    onPageChange,
    search,
  };
};
