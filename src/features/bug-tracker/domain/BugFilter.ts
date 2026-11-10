export interface BugFilter {
  repo?: string;
  status?: string;
  priority?: string;
  search?: string;
  // Account id: bugs assigned to this administrator
  assignee?: string;
  component?: string;
  pageNumber?: number;
  pageSize?: number;
}
