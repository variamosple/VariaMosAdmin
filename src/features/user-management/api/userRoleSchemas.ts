import * as z from "zod/mini";
import type { UserRole } from "../domain/Entity/UserRole";

// The link between an account and a role (EV-97 phase 2)
export const userRoleSchema: z.ZodMiniType<UserRole> = z.looseObject({
  userId: z.string(),
  roleId: z.number(),
});
