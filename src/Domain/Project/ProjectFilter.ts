import { PagedModel } from "@variamosple/variamos-components";

export class ProjectsFilter extends PagedModel {
  constructor(
    public name?: string,
    public isTemplate?: boolean,
    pageNumber?: number,
    pageSize?: number
  ) {
    super(pageNumber, pageSize);
  }
}
