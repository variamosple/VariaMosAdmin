import { PagedModel } from "@/shared/domain/Entity/PagedModel";

export class ModelsFilter extends PagedModel {
  constructor(
    public name?: string,
    public modelLevel?: string,
    public isDeleted?: boolean,
    public includeDeleted?: boolean,
    public isPublic?: boolean,
    pageNumber?: number,
    pageSize?: number,
  ) {
    super(pageNumber, pageSize);
  }
}
