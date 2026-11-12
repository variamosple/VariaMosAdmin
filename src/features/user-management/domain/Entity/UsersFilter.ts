import type { SortOrder } from "@/shared/domain/Entity/ListSort";
import { PagedModel } from "@/shared/domain/Entity/PagedModel";

export const USER_SORT_FIELDS = [
  "user",
  "name",
  "email",
  "createdAt",
  "lastLogin",
] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

/** The criteria of an account search; every one is optional. */
export interface UsersFilterFields {
  name?: string;
  email?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  // Unset: by name, ascending, as the server sorts by default
  sortBy?: UserSortField;
  sortOrder?: SortOrder;
}

export class UsersFilter extends PagedModel {
  public name?: string;
  public email?: string;
  public search?: string;
  // Unset: by name, ascending, as the server sorts by default
  public sortBy?: UserSortField;
  public sortOrder?: SortOrder;

  constructor(fields: UsersFilterFields = {}) {
    const { name, email, search, pageNumber, pageSize, sortBy, sortOrder } =
      fields;
    super(pageNumber, pageSize);
    this.name = name;
    this.email = email;
    this.search = search;
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
  }
}
