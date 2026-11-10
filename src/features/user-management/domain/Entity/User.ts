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
