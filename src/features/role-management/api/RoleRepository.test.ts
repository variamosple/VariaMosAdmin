import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { queryRoleChoices } from "./RoleRepository";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("queryRoleChoices", () => {
  it("asks for the first hundred roles", async () => {
    let asked: URLSearchParams | undefined;
    server.use(
      http.get(apiTarget("/v1/roles"), ({ request }) => {
        asked = new URL(request.url).searchParams;
        return HttpResponse.json({
          data: [{ id: 1, name: "admin" }],
          totalCount: 1,
        });
      }),
    );

    const response = await queryRoleChoices();

    expect(asked?.get("pageNumber")).toBe("1");
    expect(asked?.get("pageSize")).toBe("100");
    expect(response.data).toEqual([{ id: 1, name: "admin" }]);
  });
});
