import { useEffect, useRef } from "react";

const useListenOutsideClicks = <T extends HTMLElement = HTMLElement>(
  onOutsideClick: () => void,
) => {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      const inside =
        target instanceof Node && elementRef.current?.contains(target);
      if (elementRef.current && !inside) {
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
