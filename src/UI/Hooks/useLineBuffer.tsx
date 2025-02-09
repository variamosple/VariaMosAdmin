import { useCallback, useState } from "react";

export const useLineBuffer = (maxSize: number) => {
  const [buffer, setBuffer] = useState("");

  const addToBuffer = useCallback(
    (newContent: string) => {
      setBuffer((prevBuffer) => {
        let updatedBuffer = prevBuffer + newContent;

        const lines = updatedBuffer.split("\n");

        while (updatedBuffer.length > maxSize && lines.length > 0) {
          lines.shift();
          updatedBuffer = lines.join("\n");
        }

        return updatedBuffer;
      });
    },
    [maxSize]
  );

  return { buffer, addToBuffer };
};
