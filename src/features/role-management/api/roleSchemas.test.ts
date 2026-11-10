import { userRoleSchema } from "@/features/user-management/api/userRoleSchemas";
import {
  foundRoleSchema,
  roleDetailsSchema,
  rolePermissionSchema,
} from "./roleSchemas";

describe("access answers (EV-97 phase 2)", () => {
  it("reads a role that does not exist as null", () => {
    expect(foundRoleSchema.parse(null)).toBeNull();
  });

  it("reads the permissions of a role in the details of an account", () => {
    const [role] = roleDetailsSchema.parse([
      { id: 1, name: "Admin", permissions: [{ id: 2, name: "users::query" }] },
    ]);

    expect(role?.permissions?.[0]?.name).toBe("users::query");
  });

  it.each([
    [
      "a role permission",
      rolePermissionSchema,
      { roleId: "5", permissionId: 2 },
    ],
    ["an account role", userRoleSchema, { userId: "u-1", roleId: [5] }],
  ])("refuses %s with an id that is not a number", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });
});
