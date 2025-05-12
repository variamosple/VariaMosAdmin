import { PagedModel } from "@variamosple/variamos-components";

export class LanguagesFilter extends PagedModel {
  constructor(
    public name?: string,
    public status?: string,
    pageNumber?: number,
    pageSize?: number
  ) {
    super(pageNumber, pageSize);
  }
}
