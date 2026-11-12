export interface User {
  id?: string;
  user: string;
  name: string;
  email: string;
  countryCode?: string | null;
  countryName?: string | null;
  isEnabled: boolean;
  isDeleted: boolean;
  createdAt: Date;
  lastLogin?: Date | null;
}

/** The state of an account as the lists show it. */
export const accountStatus = (user?: Pick<User, "isDeleted" | "isEnabled">) => {
  if (user?.isDeleted) return "deleted";
  return user?.isEnabled ? "active" : "disabled";
};
