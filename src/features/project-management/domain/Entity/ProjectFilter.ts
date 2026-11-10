import { PagedModel } from "@/shared/domain/Entity/PagedModel";

export class ProjectsFilter extends PagedModel {
  constructor(
    public name?: string,
    public isTemplate?: boolean,
    public isDeleted?: boolean,
    public includeDeleted?: boolean,
    pageNumber?: number,
    pageSize?: number,
  ) {
    super(pageNumber, pageSize);
  }
}
