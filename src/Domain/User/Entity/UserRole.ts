export class UserRole {
  userId: string;
  roleId: number;

  constructor(userId: string, roleId: number) {
    this.userId = userId;
    this.roleId = roleId;
  }
}
