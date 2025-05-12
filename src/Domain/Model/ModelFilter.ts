import { PagedModel } from "@variamosple/variamos-components";

export class ModelsFilter extends PagedModel {
  constructor(public name?: string, pageNumber?: number, pageSize?: number) {
    super(pageNumber, pageSize);
  }
}
