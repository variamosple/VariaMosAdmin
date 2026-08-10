import type { Bug } from "@/features/bug-tracker/domain/Bug";
import type { Language } from "@/features/language-management/domain/Entity/Language";
import type { User } from "@/features/user-management/domain/Entity/User";

export const createUserMock = (overrides?: Partial<User>): User => ({
  id: "user-default-id",
  name: "Default User",
  user: "defaultuser",
  email: "default@test.com",
  isEnabled: true,
  isDeleted: false,
  createdAt: new Date(),
  ...overrides,
});

export const createLanguageMock = (
  overrides?: Partial<Language>,
): Language => ({
  id: 1,
  name: "Default DSL",
  type: "DSL",
  stateAccept: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createBugMock = (overrides?: Partial<Bug>): Bug => ({
  id: "bug-default-id",
  title: "Default Bug",
  description: "Default description",
  priority: "medium",
  category: "UI",
  status: "pending",
  createdAt: new Date().toISOString(),
  ...overrides,
});
