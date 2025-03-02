import { PagedModel } from "variamos-components";

export class RolesFilter extends PagedModel {
  constructor(public name?: string, pageNumber?: number, pageSize?: number) {
    super(pageNumber, pageSize);
  }
}
