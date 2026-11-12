import { PagedModel } from "@/shared/domain/Entity/PagedModel";

/** The criteria of a model search; every one is optional. */
export interface ModelsFilterFields {
  name?: string;
  modelLevel?: string;
  isDeleted?: boolean;
  includeDeleted?: boolean;
  isPublic?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export class ModelsFilter extends PagedModel {
  public name?: string;
  public modelLevel?: string;
  public isDeleted?: boolean;
  public includeDeleted?: boolean;
  public isPublic?: boolean;

  constructor(fields: ModelsFilterFields = {}) {
    const {
      name,
      modelLevel,
      isDeleted,
      includeDeleted,
      isPublic,
      pageNumber,
      pageSize,
    } = fields;
    super(pageNumber, pageSize);
    this.name = name;
    this.modelLevel = modelLevel;
    this.isDeleted = isDeleted;
    this.includeDeleted = includeDeleted;
    this.isPublic = isPublic;
  }
}
