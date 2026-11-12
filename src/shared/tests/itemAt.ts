/** The item at `index` of a list the test expects to hold it. */
export const itemAt = <T>(items: readonly T[], index: number): T => {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`The list has no item ${index} (${items.length} items)`);
  }
  return item;
};
