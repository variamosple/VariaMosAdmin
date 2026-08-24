export interface Language {
  id?: number;
  name?: string;
  abstractSyntax?: JSON;
  concreteSyntax?: JSON;
  type?: string;
  stateAccept?: LanguageStatus | string;
  semantics?: JSON;
  createdAt?: Date;
  updatedAt?: Date;
  owners?: LanguageOwner[];
}

export interface LanguageOwner {
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
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  REQUEST_CHANGES = "REQUEST_CHANGES",
  DISABLED = "DISABLED",
  DELETED = "DELETED",
}

// Temporary mapping for compatibility with current DB state
export const MAP_TO_CURRENT_STATUS: Record<LanguageStatus, string> = {
  [LanguageStatus.APPROVED]: "ACTIVE",
  [LanguageStatus.IN_REVIEW]: "PENDING",
  [LanguageStatus.DRAFT]: "PENDING",
  [LanguageStatus.REQUEST_CHANGES]: "PENDING",
  [LanguageStatus.DISABLED]: "PENDING",
  [LanguageStatus.DELETED]: "DELETED",
  // Fallbacks
  [LanguageStatus.ACTIVE]: "ACTIVE",
  [LanguageStatus.PENDING]: "PENDING",
};
