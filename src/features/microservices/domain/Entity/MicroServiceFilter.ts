import { PagedModel } from "@/shared/domain/Entity/PagedModel";

export class MicroServiceFilter extends PagedModel {
  constructor(
    public name?: string,
    pageNumber?: number,
    pageSize?: number,
  ) {
    super(pageNumber, pageSize);
  }
}
