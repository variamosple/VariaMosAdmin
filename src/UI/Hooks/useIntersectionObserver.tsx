import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";

const useIntersectionObserver = (
  isDataLoading: boolean,
  page: number,
  setPage: Dispatch<SetStateAction<number>>
) => {
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastEntryRef = useCallback(
    (node: Element | null) => {
      if (isDataLoading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isDataLoading, hasMore, setPage]
  );

  return { lastEntryRef, setHasMore, setPage, page };
};

export default useIntersectionObserver;
