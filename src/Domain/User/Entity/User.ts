export interface User {
  id?: string;
  user: string;
  name: string;
  email: string;
  isEnabled: boolean;
  isDeleted: boolean;
  createdAt: Date;
  lastLogin?: Date;
}
