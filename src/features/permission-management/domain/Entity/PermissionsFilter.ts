import { PagedModel } from "@variamosple/variamos-components";
import type { SortOrder } from "@/shared/domain/Entity/ListSort";

export const PERMISSION_SORT_FIELDS = ["id", "name"] as const;
export type PermissionSortField = (typeof PERMISSION_SORT_FIELDS)[number];

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
