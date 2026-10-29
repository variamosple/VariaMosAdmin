import { PagedModel } from "@/shared/domain/Entity/PagedModel";

/** Entries per page; the server accepts up to 100. */
const JOURNAL_PAGE_SIZE = 50;

/** A value read from JSON, as the journal stores before and after. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** The account of an entry, when it still exists. */
export interface JournalAccount {
  id: string;
  name: string | null;
  email: string | null;
}

export interface ActivityEntry {
  id: string;
  occurredAt: string;
  actorId: string | null;
  actor: JournalAccount | null;
  action: string;
  entityType: string;
  entityId: string | null;
  outcome: "success" | "failed";
  errorCode: string | null;
  before: JsonValue;
  after: JsonValue;
  transactionId: string | null;
}

export interface AccessEntry {
  id: string;
  occurredAt: string;
  userId: string | null;
  user: JournalAccount | null;
  event: string;
  outcome: "success" | "failed";
  reason: string | null;
  ip: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
}

/** Filters common to both journals; an empty value is not sent. */
class JournalFilter extends PagedModel {
  public from?: string;
  public to?: string;
  public user?: string;
  public outcome?: string;

  constructor(values: Partial<JournalFilter> = {}) {
    super(values.pageNumber ?? 1, JOURNAL_PAGE_SIZE);
    Object.assign(this, { pageNumber: 1 }, values, {
      pageSize: JOURNAL_PAGE_SIZE,
    });
  }
}

export class ActivityFilter extends JournalFilter {
  public action?: string;
  public entityType?: string;
  public entityId?: string;

  constructor(values: Partial<ActivityFilter> = {}) {
    super(values);
    Object.assign(this, values, { pageSize: JOURNAL_PAGE_SIZE });
  }
}

export class AccessFilter extends JournalFilter {
  public event?: string;
  public reason?: string;
  public ip?: string;

  constructor(values: Partial<AccessFilter> = {}) {
    super(values);
    Object.assign(this, values, { pageSize: JOURNAL_PAGE_SIZE });
  }
}

/** The operations of the activity journal (T-24 lot 1). */
export const ACTIVITY_ACTIONS = [
  "user.enable",
  "user.disable",
  "user.delete",
  "user.recovery-link",
  "user.mfa.reset",
  "user.role.assign",
  "user.role.remove",
  "role.create",
  "role.update",
  "role.delete",
  "role.permission.assign",
  "role.permission.remove",
  "permission.create",
  "permission.update",
  "permission.delete",
  "configuration.update",
  "micro-service.start",
  "micro-service.stop",
  "micro-service.restart",
  "notification.dispatch",
];

export const ENTITY_TYPES = [
  "user",
  "role",
  "permission",
  "configuration",
  "micro-service",
  "notification",
];

/** The events of the access journal (T-24 lot 2). */
export const ACCESS_EVENTS = [
  "sign-in",
  "sign-in.mfa",
  "sign-in.google",
  "account.locked",
  "access.refused",
];
