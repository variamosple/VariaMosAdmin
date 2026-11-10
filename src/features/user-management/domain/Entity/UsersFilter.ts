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

export class UsersFilter extends PagedModel {
  constructor(
    public name?: string,
    public email?: string,
    public search?: string,
    pageNumber?: number,
    pageSize?: number,
    // Unset: by name, ascending, as the server sorts by default
    public sortBy?: UserSortField,
    public sortOrder?: SortOrder,
  ) {
    super(pageNumber, pageSize);
  }
}
