import * as z from "zod/mini";
import { optionalText } from "@/shared/api/schemas";
import type { Project } from "../domain/Entity/Project";

// Projects as vms_projects sends them to the administration (EV-97,
// services of the other teams). Its ResponseModel sends every empty field
// as null; the content of a project is the editor's JSON, kept as it is

const absent = <T>(schema: z.ZodMiniType<T>) =>
  z.pipe(
    z.optional(z.nullable(schema)),
    z.transform((value) => value ?? undefined),
  );

const ownerSchema = z.looseObject({
  id: optionalText,
  name: optionalText,
  email: z.pipe(
    z.nullable(z.string()),
    z.transform((value) => value ?? ""),
  ),
});

export const projectSchema: z.ZodMiniType<Project> = z.looseObject({
  id: optionalText,
  name: optionalText,
  description: optionalText,
  author: optionalText,
  source: optionalText,
  // A datetime without a time zone in vms_projects: kept as sent
  date: optionalText,
  template: absent(z.boolean()),
  project: absent(
    z.custom<NonNullable<Project["project"]>>(
      (value) => typeof value === "object" && value !== null,
    ),
  ),
  owners: absent(z.array(ownerSchema)),
  isDeleted: absent(z.boolean()),
});

export const projectsSchema = z.array(projectSchema);
