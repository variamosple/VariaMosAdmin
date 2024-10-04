export class RolePermission {
  roleId: number;
  permissionId: number;

  constructor(id: number, permissionId: number) {
    this.roleId = id;
    this.permissionId = permissionId;
  }
}
