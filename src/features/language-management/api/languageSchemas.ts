import * as z from "zod/mini";
import { optionalText, wholeNumber } from "@/shared/api/schemas";
import type { Language } from "../domain/Entity/Language";

// Languages as variamos_ms_languages sends them to the administration
// (EV-97, services of the other teams). Every field may be left out or be
// NULL in the database; the dates stay ISO text for the DateTime component.
// The id may come as text (see wholeNumber)

const ownerSchema = z.looseObject({
  id: optionalText,
  name: optionalText,
  email: optionalText,
  accessLevel: optionalText,
});

export const languageSchema: z.ZodMiniType<Language> = z.looseObject({
  id: z.optional(wholeNumber),
  name: optionalText,
  type: optionalText,
  stateAccept: optionalText,
  createdAt: optionalText,
  updatedAt: optionalText,
  owners: z.optional(z.array(ownerSchema)),
});

export const languagesSchema = z.array(languageSchema);
