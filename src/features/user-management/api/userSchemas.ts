import * as z from "zod/mini";
import { isoDate, textOrEmpty } from "@/shared/api/schemas";
import type { User } from "../domain/Entity/User";

// The account as variamos_ms_admin serializes it (EV-97 lot 6c)
export const userSchema: z.ZodMiniType<User> = z.looseObject({
  id: z.optional(z.string()),
  user: textOrEmpty,
  name: textOrEmpty,
  email: textOrEmpty,
  countryCode: z.optional(z.nullable(z.string())),
  countryName: z.optional(z.nullable(z.string())),
  isEnabled: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: isoDate,
  lastLogin: z.optional(z.nullable(isoDate)),
});

export const usersSchema = z.array(userSchema);

export const recoveryLinkSchema = z.looseObject({
  recoveryUrl: z.string(),
});
