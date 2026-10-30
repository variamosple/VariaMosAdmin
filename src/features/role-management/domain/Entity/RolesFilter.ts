import type { SortOrder } from "@/shared/domain/Entity/ListSort";
import { PagedModel } from "@/shared/domain/Entity/PagedModel";

export const ROLE_SORT_FIELDS = ["id", "name"] as const;
export type RoleSortField = (typeof ROLE_SORT_FIELDS)[number];

export class RolesFilter extends PagedModel {
  constructor(
    public name?: string,
    pageNumber?: number,
    pageSize?: number,
    // Unset: by name, ascending, as the server sorts by default
    public sortBy?: RoleSortField,
    public sortOrder?: SortOrder,
  ) {
    super(pageNumber, pageSize);
  }
}
