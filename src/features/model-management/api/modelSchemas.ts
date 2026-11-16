import * as z from "zod/mini";
import { optionalText, wholeNumber } from "@/shared/api/schemas";
import type { Model } from "../domain/Entity/Model";

// Models as vms_projects sends them to the administration (EV-97, services
// of the other teams). Its ResponseModel sends every empty field as null

const absent = <T>(schema: z.ZodMiniType<T>) =>
  z.pipe(
    z.optional(z.nullable(schema)),
    z.transform((value) => value ?? undefined),
  );

const ownerSchema = z.looseObject({
  id: z.string(),
  name: z.pipe(
    z.nullable(z.string()),
    z.transform((value) => value ?? ""),
  ),
  email: z.pipe(
    z.nullable(z.string()),
    z.transform((value) => value ?? ""),
  ),
});

export const modelSchema: z.ZodMiniType<Model> = z.looseObject({
  id: optionalText,
  projectId: z.string(),
  projectName: optionalText,
  engineeringType: optionalText,
  name: z.string(),
  type: optionalText,
  description: optionalText,
  author: optionalText,
  source: optionalText,
  owners: absent(z.array(ownerSchema)),
  isDeleted: absent(z.boolean()),
  modelLevel: optionalText,
  isPublic: absent(z.boolean()),
  // A language id, which production may send as text (see wholeNumber)
  languageId: absent(wholeNumber),
});

export const modelsSchema = z.array(modelSchema);
