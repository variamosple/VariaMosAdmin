import * as z from "zod/mini";
import type {
  AccessEntry,
  ActivityEntry,
  JsonValue,
} from "../domain/JournalEntry";

// Journal entries as variamos_ms_admin reads them from its two log tables
// (EV-97 phase 2). The outcome is constrained by the tables; the values
// before and after a change are free JSON, shown as they are

const accountSchema = z.nullable(
  z.looseObject({
    id: z.string(),
    name: z.nullable(z.string()),
    email: z.nullable(z.string()),
  }),
);

const outcomeSchema = z.enum(["success", "failed"]);

const freeJson = z.custom<JsonValue>();

export const activityEntriesSchema: z.ZodMiniType<ActivityEntry[]> = z.array(
  z.looseObject({
    id: z.string(),
    occurredAt: z.string(),
    actorId: z.nullable(z.string()),
    actor: accountSchema,
    action: z.string(),
    entityType: z.string(),
    entityId: z.nullable(z.string()),
    outcome: outcomeSchema,
    errorCode: z.nullable(z.string()),
    before: freeJson,
    after: freeJson,
    transactionId: z.nullable(z.string()),
  }),
);

export const accessEntriesSchema: z.ZodMiniType<AccessEntry[]> = z.array(
  z.looseObject({
    id: z.string(),
    occurredAt: z.string(),
    userId: z.nullable(z.string()),
    user: accountSchema,
    event: z.string(),
    outcome: outcomeSchema,
    reason: z.nullable(z.string()),
    ip: z.nullable(z.string()),
    method: z.nullable(z.string()),
    path: z.nullable(z.string()),
    statusCode: z.nullable(z.number()),
  }),
);
