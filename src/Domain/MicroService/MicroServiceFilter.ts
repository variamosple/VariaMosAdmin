import { PagedModel } from "../Core/Entity/PagedModel";

export class MicroServiceFilter extends PagedModel {
  constructor(public name?: string, pageNumber?: number, pageSize?: number) {
    super(pageNumber, pageSize);
  }
}
