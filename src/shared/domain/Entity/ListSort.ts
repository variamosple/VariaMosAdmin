export type SortOrder = "asc" | "desc";

/** The column a list is sorted by, and its direction */
export interface ListSort<Field extends string> {
  by: Field;
  order: SortOrder;
}

/**
 * A click on the sorted column turns its order; on another column, it sorts
 * by that column, ascending
 */
export const nextSort = <Field extends string>(
  sort: ListSort<Field>,
  field: Field,
): ListSort<Field> => ({
  by: field,
  order: sort.by === field && sort.order === "asc" ? "desc" : "asc",
});

/**
 * The sort as filter fields: unset for the default of the server (by name,
 * ascending), so that the address stays short
 */
export const sortFields = <Field extends string>(
  sort: ListSort<Field>,
): { sortBy?: Field; sortOrder?: SortOrder } => ({
  sortBy: sort.by === "name" ? undefined : sort.by,
  sortOrder: sort.order === "asc" ? undefined : sort.order,
});

/** The sort written in the address; an unknown column or order is ignored */
export const readSort = <Field extends string>(
  params: URLSearchParams,
  fields: readonly Field[],
): { sortBy?: Field; sortOrder?: SortOrder } => ({
  sortBy: fields.find((field) => field === params.get("sortBy")),
  sortOrder: params.get("sortOrder") === "desc" ? "desc" : undefined,
});
