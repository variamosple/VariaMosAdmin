import * as z from "zod/mini";
import type { Permission } from "../domain/Entity/Permission";

// A permission as variamos_ms_admin serializes it (EV-97 phase 2)
export const permissionSchema: z.ZodMiniType<Permission> = z.looseObject({
  id: z.optional(z.number()),
  name: z.string(),
});

export const permissionsSchema = z.array(permissionSchema);
