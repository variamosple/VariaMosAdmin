/**
 * The lines of a text, each with a key for React: the line itself, and its
 * rank among identical lines. The key stays the same when the text is shown
 * again, unlike the position in the list.
 */
export const keyedLines = (text: string): { key: string; line: string }[] => {
  const seen = new Map<string, number>();
  return text.split("\n").map((line) => {
    const rank = (seen.get(line) ?? 0) + 1;
    seen.set(line, rank);
    return { key: `${rank}:${line}`, line };
  });
};
