import { useCallback, useState } from "react";

export const useLineBuffer = (maxSize: number) => {
  const [buffer, setBuffer] = useState("");

  const addToBuffer = useCallback(
    (newContent: string) => {
      setBuffer((prevBuffer) => {
        const updatedBuffer = prevBuffer + newContent;
        if (updatedBuffer.length <= maxSize) return updatedBuffer;

        // Drops the oldest whole lines until the rest fits: keeps what follows
        // the first line break that leaves at most maxSize characters, in one
        // pass instead of one split and join per dropped line
        const cut = updatedBuffer.indexOf(
          "\n",
          updatedBuffer.length - maxSize - 1,
        );
        return cut === -1 ? "" : updatedBuffer.slice(cut + 1);
      });
    },
    [maxSize],
  );

  return { buffer, addToBuffer };
};
