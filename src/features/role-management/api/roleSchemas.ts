import * as z from "zod/mini";
import { permissionSchema } from "@/features/permission-management/api/permissionSchemas";
import type { Role, RoleDetails } from "../domain/Entity/Role";
import type { RolePermission } from "../domain/Entity/RolePermission";

// Roles as variamos_ms_admin serializes them (EV-97 phase 2)
export const roleSchema: z.ZodMiniType<Role> = z.looseObject({
  id: z.optional(z.number()),
  name: z.string(),
});

export const rolesSchema = z.array(roleSchema);

/** A role read by id: null when it does not exist. */
export const foundRoleSchema = z.nullable(roleSchema);

export const roleDetailsSchema: z.ZodMiniType<RoleDetails[]> = z.array(
  z.looseObject({
    id: z.optional(z.number()),
    name: z.string(),
    permissions: z.optional(z.array(permissionSchema)),
  }),
);

export const rolePermissionSchema: z.ZodMiniType<RolePermission> =
  z.looseObject({ roleId: z.number(), permissionId: z.number() });
