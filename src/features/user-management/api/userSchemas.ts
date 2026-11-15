import * as z from "zod/mini";
import { isoDate, textOrEmpty } from "@/shared/api/schemas";
import type { User } from "../domain/Entity/User";

// The account as variamos_ms_admin serializes it (EV-97 lot 6c)
const accountFields = {
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
};

export const userSchema: z.ZodMiniType<User> = z.looseObject(accountFields);

// A row of the list, read as stored (EV-29): no made-up creation date, and
// the address flagged when it is not well formed
export const userListItemSchema: z.ZodMiniType<User> = z.looseObject({
  ...accountFields,
  createdAt: z.nullable(isoDate),
  emailValid: z.optional(z.boolean()),
});

export const usersSchema = z.array(userListItemSchema);

export const recoveryLinkSchema = z.looseObject({
  recoveryUrl: z.string(),
});
