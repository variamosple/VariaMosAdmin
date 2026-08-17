import { useEffect, useRef } from "react";

const useListenOutsideClicks = <T extends HTMLElement = HTMLElement>(
  onOutsideClick: () => void,
) => {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (elementRef.current && !elementRef.current.contains(target)) {
        onOutsideClick?.();
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [onOutsideClick]);

  return { elementRef };
};

export default useListenOutsideClicks;
