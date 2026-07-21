import { Permission } from "@/features/permission-management/domain/Entity/Permission";

export interface Role {
  id?: number;
  name: string;
}

export interface RoleDetails extends Role {
  permissions?: Permission[];
}
