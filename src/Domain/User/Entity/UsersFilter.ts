import { PagedModel } from "../../Core/Entity/PagedModel";

export class UsersFilter extends PagedModel {
  constructor(
    public name?: string,
    public email?: string,
    pageNumber?: number,
    pageSize?: number
  ) {
    super(pageNumber, pageSize);
  }
}
