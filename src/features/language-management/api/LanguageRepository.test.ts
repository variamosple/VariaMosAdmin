import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { LanguagesFilter } from "../domain/Entity/LanguageFilter";
import {
  deleteLanguage,
  queryLanguages,
  updateLanguage,
} from "./LanguageRepository";

const languagesApi = (path: string) =>
  `${(AppConfig.LANGUAGES_API_URL || "").replace(/\/$/, "")}${path}`;

describe("LanguageRepository (EV-97, services of the other teams)", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("reads the languages and their total", async () => {
    server.use(
      http.get(languagesApi("/v1/admin/languages"), () =>
        HttpResponse.json({
          transactionId: "adminGetLanguages",
          totalCount: 1,
          data: [{ id: 7, name: "Feature model", type: null, owners: [] }],
        }),
      ),
    );

    const response = await queryLanguages(new LanguagesFilter());

    expect(response.totalCount).toBe(1);
    expect(response.data?.[0]?.type).toBeUndefined();
  });

  it("gives an error, not a broken list, for a body of the wrong shape", async () => {
    server.use(
      http.get(languagesApi("/v1/admin/languages"), () =>
        HttpResponse.json({ data: { id: 7 } }),
      ),
    );

    const response = await queryLanguages(new LanguagesFilter());

    expect(response.errorCode).toBe(500);
    expect(response.message).toBe(
      "Error when trying to query language, please try again later.",
    );
  });

  it("reads the partial language an update answers with", async () => {
    server.use(
      http.put(languagesApi("/v1/admin/languages/7"), async ({ request }) =>
        HttpResponse.json({ data: await request.json() }),
      ),
    );

    const response = await updateLanguage({ id: 7, name: "Renamed" });

    expect(response.data?.name).toBe("Renamed");
  });

  it("deletes a language, which answers without data", async () => {
    server.use(
      http.delete(languagesApi("/v1/admin/languages/7"), () =>
        HttpResponse.json({ transactionId: "adminDeleteLanguages" }),
      ),
    );

    expect((await deleteLanguage(7)).errorCode).toBeFalsy();
  });

  it("says the service cannot be reached, for each call", async () => {
    server.use(
      http.all(languagesApi("/v1/admin/languages*"), () =>
        HttpResponse.error(),
      ),
    );

    const responses = await Promise.all([
      queryLanguages(new LanguagesFilter()),
      updateLanguage({ id: 7 }),
      deleteLanguage(7),
    ]);

    for (const response of responses) {
      expect(response.errorCode).toBeTruthy();
    }
  });
});
