import { PagedModel } from "@variamosple/variamos-components";

export class PermissionsFilter extends PagedModel {
  constructor(public name?: string, pageNumber?: number, pageSize?: number) {
    super(pageNumber, pageSize);
  }
}
