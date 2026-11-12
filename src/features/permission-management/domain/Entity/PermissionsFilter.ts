import type { SortOrder } from "@/shared/domain/Entity/ListSort";
import { PagedModel } from "@/shared/domain/Entity/PagedModel";

export const PERMISSION_SORT_FIELDS = ["id", "name"] as const;
export type PermissionSortField = (typeof PERMISSION_SORT_FIELDS)[number];

/** The criteria of a permission search; every one is optional. */
export interface PermissionsFilterFields {
  /** Part of the permission name, or its exact id */
  name?: string;
  pageNumber?: number;
  pageSize?: number;
  // Unset: by name, ascending, as the server sorts by default
  sortBy?: PermissionSortField;
  sortOrder?: SortOrder;
}

export class PermissionsFilter extends PagedModel {
  /** Part of the permission name, or its exact id */
  public name?: string;
  // Unset: by name, ascending, as the server sorts by default
  public sortBy?: PermissionSortField;
  public sortOrder?: SortOrder;

  constructor(fields: PermissionsFilterFields = {}) {
    const { name, pageNumber, pageSize, sortBy, sortOrder } = fields;
    super(pageNumber, pageSize);
    this.name = name;
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
  }
}
