// The page asked of a paginated list. Same shape as the PagedModel of
// @variamosple/variamos-components, which its usePaginatedQuery hook expects,
// so that the domain does not depend on the component library.
export class PagedModel {
  constructor(
    public pageNumber = 1,
    public pageSize = 20,
  ) {}
}
