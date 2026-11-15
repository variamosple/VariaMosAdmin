export interface Language {
  id?: number;
  name?: string;
  abstractSyntax?: JSON;
  concreteSyntax?: JSON;
  type?: string;
  stateAccept?: LanguageStatus | string;
  semantics?: JSON;
  // ISO text as the server sends it, or a Date
  createdAt?: string | Date;
  updatedAt?: string | Date;
  owners?: LanguageOwner[];
}

interface LanguageOwner {
  id?: string;
  name?: string;
  email?: string;
  accessLevel?: string;
}

export enum LanguageStatus {
  // Current (DB / API)
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",

  // Target (Future)
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
  REQUEST_CHANGES = "REQUEST_CHANGES",
  DISABLED = "DISABLED",
  DELETED = "DELETED",
}
