import type { Permission } from "@/features/permission-management/domain/Entity/Permission";

export interface Role {
  id?: number;
  name: string;
}

export interface RoleDetails extends Role {
  permissions?: Permission[];
}

/** The rule of the server: a capital on the first word only ("Test role") */
export const ROLE_NAME_PATTERN = /^[A-Z][a-z]*(?:\s[a-z]+)*$/;
