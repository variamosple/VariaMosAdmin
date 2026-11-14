import * as z from "zod/mini";
import { optionalText } from "@/shared/api/schemas";
import type { BackupReport } from "../domain/backupStatus";
import type { MicroServiceConfigItem } from "../domain/Entity/MicroService";

// The parameters of a service as variamos_ms_admin serializes them (EV-97
// phase 2). They come from the global configurations: the type is free
// text there, "array" and "object" included
export const configItemSchema: z.ZodMiniType<MicroServiceConfigItem> =
  z.looseObject({
    id: z.optional(z.number()),
    serviceName: z.string(),
    key: z.string(),
    value: z.string(),
    type: z.string(),
    isSecret: z.boolean(),
    isReadOnly: z.boolean(),
    description: optionalText,
    updatedBy: optionalText,
    createdAt: optionalText,
    updatedAt: optionalText,
  });

export const configItemsSchema = z.array(configItemSchema);

// GET /v1/backups/status (EV-86): the nightly database backup
export const backupReportSchema: z.ZodMiniType<BackupReport> = z.looseObject({
  configured: z.boolean(),
  status: z.nullable(
    z.looseObject({
      file: z.nullable(z.string()),
      createdAt: z.nullable(z.string()),
      sizeBytes: z.nullable(z.number()),
    }),
  ),
  problems: z.array(z.looseObject({ kind: z.string(), message: z.string() })),
});
