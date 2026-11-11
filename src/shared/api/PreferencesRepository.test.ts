import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { getMyPreferences, updateMyTimeZone } from "./PreferencesRepository";

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

describe("PreferencesRepository (EV-115 lot C)", () => {
  it("reads the preferences of the account", async () => {
    expect((await getMyPreferences()).data).toEqual({
      timeZone: null,
      updatedAt: null,
    });
  });

  it("sends the time zone, or null for the browser's", async () => {
    const bodies: { timeZone: string | null }[] = [];
    server.use(
      http.put(
        apiTarget("/auth/my-account/preferences"),
        async ({ request }) => {
          const body = (await request.json()) as { timeZone: string | null };
          bodies.push(body);
          return HttpResponse.json({ data: { timeZone: body.timeZone } });
        },
      ),
    );

    expect((await updateMyTimeZone("Europe/Paris")).data?.timeZone).toBe(
      "Europe/Paris",
    );
    await updateMyTimeZone(null);

    expect(bodies).toEqual([{ timeZone: "Europe/Paris" }, { timeZone: null }]);
  });

  it("gives the server's refusal", async () => {
    server.use(
      http.put(apiTarget("/auth/my-account/preferences"), () =>
        HttpResponse.json(
          { errorCode: "INVALID_INPUT", message: "The time zone is unknown." },
          { status: 400 },
        ),
      ),
    );

    const response = await updateMyTimeZone("Mars/Base");

    expect(response.errorCode).toBeTruthy();
    expect(response.message).toBe("The time zone is unknown.");
  });
});
