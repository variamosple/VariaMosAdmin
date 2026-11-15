// The pages record their visits under the name of their component. The
// ranking shows a readable name and the part of VariaMos the page belongs to.
export type PageArea = "Languages" | "Administration" | "Laboratory" | "Other";

const PAGES: Record<string, { name: string; area: PageArea }> = {
  UserLanguageList: { name: "My languages", area: "Languages" },
  EditLanguage: { name: "Language editor", area: "Languages" },
  AllLanguageList: { name: "All languages", area: "Languages" },
  PublicLanguageList: { name: "Public languages", area: "Languages" },
  CreateLanguage: { name: "New language", area: "Languages" },
  AdminLanguageList: { name: "Languages (admin)", area: "Languages" },
  UserList: { name: "Users", area: "Administration" },
  UserDetails: { name: "User details", area: "Administration" },
  RoleList: { name: "Roles", area: "Administration" },
  RoleDetails: { name: "Role details", area: "Administration" },
  PermissionList: { name: "Permissions", area: "Administration" },
  AdminBugList: { name: "Bug reports", area: "Administration" },
  Monitoring: { name: "Monitoring", area: "Administration" },
  AdminModelList: { name: "Models", area: "Administration" },
  AdminProjectList: { name: "Projects", area: "Administration" },
  AdminConfigurationList: { name: "Configuration", area: "Administration" },
  AdminJournal: { name: "Activity journal", area: "Administration" },
  Metrics: { name: "Metrics", area: "Administration" },
  "notifications-admin-dashboard": {
    name: "Notifications",
    area: "Administration",
  },
  MyAccount: { name: "My account", area: "Administration" },
  ExperimentsList: { name: "Experiments", area: "Laboratory" },
  GroupExperimentsList: { name: "Group experiments", area: "Laboratory" },
  SharedExperimentsList: { name: "Shared experiments", area: "Laboratory" },
  UserExperimentsList: { name: "My experiments", area: "Laboratory" },
};

/** A recorded page id as the ranking shows it; an unknown id stays as is. */
export const pageOf = (id: string): { name: string; area: PageArea } =>
  PAGES[id] ?? { name: id, area: "Other" };
