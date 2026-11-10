import { accessEntriesSchema, activityEntriesSchema } from "./journalSchemas";

const access = {
  id: "12",
  occurredAt: "2026-10-27T10:00:00.000Z",
  userId: null,
  user: null,
  event: "sign-in",
  outcome: "failed",
  reason: "wrong-password",
  ip: "203.0.113.4",
  method: "POST",
  path: "/auth/sign-in",
  statusCode: 401,
};

describe("journal answers (EV-97 phase 2)", () => {
  it("reads an access entry of an unknown account", () => {
    expect(accessEntriesSchema.safeParse([access]).success).toBe(true);
  });

  it("refuses an outcome the tables do not allow", () => {
    expect(
      accessEntriesSchema.safeParse([{ ...access, outcome: "ok" }]).success,
    ).toBe(false);
  });

  it("keeps the values before and after a change as they are", () => {
    const [entry] = activityEntriesSchema.parse([
      {
        id: "3",
        occurredAt: "2026-10-27T10:00:00.000Z",
        actorId: "u-1",
        actor: { id: "u-1", name: null, email: "ana@example.com" },
        action: "configuration.update",
        entityType: "configuration",
        entityId: "security.lockout",
        outcome: "success",
        errorCode: null,
        before: { attempts: 5 },
        after: { attempts: 3 },
        transactionId: null,
      },
    ]);
    expect(entry?.after).toEqual({ attempts: 3 });
  });
});
