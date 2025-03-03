import { ResponseModel } from "@variamosple/variamos-components";
import { useCallback, useState } from "react";

interface UseWatchProps<Filter, Response> {
  watchFunction: (
    filter: Filter,
    signal: AbortSignal
  ) => Promise<ResponseModel<Response>>;
  initialFilter: Filter;
}

interface WatchResult<Filter, Response> {
  data: Response | undefined;
  loadData: (filter: Filter) => Promise<ResponseModel<Response>>;
  filter: Filter | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  abort: () => void;
}

export function useWatch<Filter, Response>({
  watchFunction,
}: UseWatchProps<Filter, Response>): WatchResult<Filter, Response> {
  const [, setSignal] = useState<AbortController>();
  const [data, setData] = useState<Response>();
  const [filter, setFilter] = useState<Filter | null>(null);
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  const loadData = useCallback(
    (filter: Filter) => {
      setFilter(filter);
      setIsloading(true);
      const abortController = new AbortController();
      setSignal((prev) => {
        if (prev) {
          prev.abort();
        }

        return abortController;
      });

      return watchFunction(filter, abortController.signal)
        .then((response) => {
          setData(response.data);

          return response;
        })
        .finally(() => {
          setIsloading(false);
          setIsLoaded(true);
        });
    },
    [watchFunction]
  );

  const abort = useCallback(() => {
    setSignal((prev) => {
      if (prev) {
        prev.abort();
      }

      return undefined;
    });
  }, []);

  return {
    data,
    loadData,
    filter,
    isLoading,
    isLoaded,
    error,
    abort,
  };
}
