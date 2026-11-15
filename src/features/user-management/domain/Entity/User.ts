export interface User {
  id?: string;
  user: string;
  name: string;
  email: string;
  countryCode?: string | null;
  countryName?: string | null;
  isEnabled: boolean;
  isDeleted: boolean;
  /** Null in the list when not stored (EV-29). */
  createdAt: Date | null;
  lastLogin?: Date | null;
  /**
   * False in the list when the stored address would be refused today; the
   * row is shown and flagged instead of failing the page (EV-29).
   */
  emailValid?: boolean;
}

/** The state of an account as the lists show it. */
export const accountStatus = (user?: Pick<User, "isDeleted" | "isEnabled">) => {
  if (user?.isDeleted) return "deleted";
  return user?.isEnabled ? "active" : "disabled";
};
