import { Permission } from "@/Domain/Permission/Entity/Permission";

export interface Role {
  id?: number;
  name: string;
}

export interface RoleDetails extends Role {
  permissions?: Permission[];
}
