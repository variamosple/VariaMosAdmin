import type { SortOrder } from "@/shared/domain/Entity/ListSort";
import { PagedModel } from "@/shared/domain/Entity/PagedModel";

export const ROLE_SORT_FIELDS = ["id", "name"] as const;
export type RoleSortField = (typeof ROLE_SORT_FIELDS)[number];

/** The criteria of a role search; every one is optional. */
export interface RolesFilterFields {
  name?: string;
  pageNumber?: number;
  pageSize?: number;
  // Unset: by name, ascending, as the server sorts by default
  sortBy?: RoleSortField;
  sortOrder?: SortOrder;
}

export class RolesFilter extends PagedModel {
  public name?: string;
  // Unset: by name, ascending, as the server sorts by default
  public sortBy?: RoleSortField;
  public sortOrder?: SortOrder;

  constructor(fields: RolesFilterFields = {}) {
    const { name, pageNumber, pageSize, sortBy, sortOrder } = fields;
    super(pageNumber, pageSize);
    this.name = name;
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
  }
}
