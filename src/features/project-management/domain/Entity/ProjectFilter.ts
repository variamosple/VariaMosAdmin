import { PagedModel } from "@/shared/domain/Entity/PagedModel";

/** The criteria of a project search; every one is optional. */
export interface ProjectsFilterFields {
  name?: string;
  isTemplate?: boolean;
  isDeleted?: boolean;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export class ProjectsFilter extends PagedModel {
  public name?: string;
  public isTemplate?: boolean;
  public isDeleted?: boolean;
  public includeDeleted?: boolean;

  constructor(fields: ProjectsFilterFields = {}) {
    const {
      name,
      isTemplate,
      isDeleted,
      includeDeleted,
      pageNumber,
      pageSize,
    } = fields;
    super(pageNumber, pageSize);
    this.name = name;
    this.isTemplate = isTemplate;
    this.isDeleted = isDeleted;
    this.includeDeleted = includeDeleted;
  }
}
