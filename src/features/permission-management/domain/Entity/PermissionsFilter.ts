import { PagedModel } from "@variamosple/variamos-components";

export type PermissionSortField = "id" | "name";
export type SortOrder = "asc" | "desc";

export class PermissionsFilter extends PagedModel {
  constructor(
    /** Part of the permission name, or its exact id */
    public name?: string,
    pageNumber?: number,
    pageSize?: number,
    // Unset: by name, ascending, as the server sorts by default
    public sortBy?: PermissionSortField,
    public sortOrder?: SortOrder,
  ) {
    super(pageNumber, pageSize);
  }
}
