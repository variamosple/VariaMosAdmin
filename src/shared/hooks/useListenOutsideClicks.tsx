import { useEffect, useRef } from "react";

const useListenOutsideClicks = (onOutsideClick: () => void) => {
  const elementRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (elementRef.current && !elementRef.current.contains(event.target)) {
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
