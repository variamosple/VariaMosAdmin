import type { ResponseModel } from "@variamosple/variamos-components";
import { useCallback, useState } from "react";

/**
 * A list read in one call, with its total, its loading and its error. The
 * caller decides when to call `load`. `query` must be stable (a module
 * function): it is a dependency.
 */
export const useLoadedList = <Item>(
  query: () => Promise<ResponseModel<Item[]>>,
  failure: string,
) => {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await query();
    if (response.errorCode) {
      setError(response.message || failure);
    } else {
      setItems(response.data ?? []);
      setTotal(response.totalCount ?? response.data?.length ?? 0);
    }
    setLoading(false);
  }, [query, failure]);

  return { items, total, loading, error, load };
};
