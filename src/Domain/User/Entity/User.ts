export interface User {
  id?: string;
  user: string;
  name: string;
  email: string;
  isEnabled: boolean;
  createdAt: Date;
  lastLogin?: Date;
}
