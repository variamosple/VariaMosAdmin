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
