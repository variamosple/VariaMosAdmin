import { PagedModel } from "variamos-components";

export class UsersFilter extends PagedModel {
  constructor(
    public name?: string,
    public email?: string,
    public search?: string,
    pageNumber?: number,
    pageSize?: number
  ) {
    super(pageNumber, pageSize);
  }
}
