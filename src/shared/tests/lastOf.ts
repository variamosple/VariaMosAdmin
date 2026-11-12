/** The last item of a list the test expects to be non-empty. */
export const lastOf = <T>(items: readonly T[]): T => {
  const last = items.at(-1);
  if (last === undefined) throw new Error("The list is empty");
  return last;
};
