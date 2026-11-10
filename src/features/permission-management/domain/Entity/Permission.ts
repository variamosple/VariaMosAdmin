export interface Permission {
  id?: number;
  name: string;
}

/** The rule of the server: "resource::action" or "module::resource::action" */
export const PERMISSION_NAME_PATTERN =
  /^(?:[a-z0-9-]+::)?[a-z0-9-]+::[a-z0-9-]+$/;
