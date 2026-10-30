import { PagedModel } from "@/shared/domain/Entity/PagedModel";

export class LanguagesFilter extends PagedModel {
  constructor(
    public name?: string,
    public status?: string,
    pageNumber?: number,
    pageSize?: number,
  ) {
    super(pageNumber, pageSize);
  }
}
