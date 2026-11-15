import { render } from "@testing-library/react";
import { useSession } from "@variamosple/variamos-components";
import { HttpResponse, http } from "msw";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import { DefaultCountry, resetOfferedCountries } from ".";

const zone = vi.hoisted(() => ({ name: "America/Bogota" }));
vi.mock("@/shared/domain/TimeZone", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/domain/TimeZone")>()),
  browserTimeZone: () => zone.name,
}));

const apiTarget = (path: string) => {
  const base = AppConfig.ADMIN_API_URL || "";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const signedInAs = (permissions: string[] | null, id = "user-1") => {
  (useSession as import("vitest").Mock).mockReturnValue({
    user: permissions
      ? { id, user: id, name: id, email: "", roles: [], permissions }
      : null,
  });
};

/** The countries the admin was sent, in order. */
function countryServer(status = 200) {
  const sent: string[] = [];
  server.use(
    http.put(
      apiTarget("/auth/my-account/default-country"),
      async ({ request }) => {
        sent.push(await request.text());
        return HttpResponse.json({ data: { saved: true } }, { status });
      },
    ),
  );
  return sent;
}

const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 20);
  });

describe("DefaultCountry (EV-90)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetOfferedCountries();
    zone.name = "America/Bogota";
  });

  it("offers the country of the browser's time zone once per page load", async () => {
    const sent = countryServer();
    signedInAs(["my-account::update"]);

    const { rerender } = render(<DefaultCountry />);
    await settle();
    rerender(<DefaultCountry />);
    await settle();

    expect(sent).toEqual([JSON.stringify({ countryCode: "CO" })]);
  });

  it("offers none to a guest, without the right to change its account", async () => {
    const sent = countryServer();
    signedInAs(["languages::query"]);

    render(<DefaultCountry />);
    await settle();

    expect(sent).toEqual([]);
  });

  it("offers none before the sign-in", async () => {
    const sent = countryServer();
    signedInAs(null);

    render(<DefaultCountry />);
    await settle();

    expect(sent).toEqual([]);
  });

  it("offers none for a time zone of no country", async () => {
    const sent = countryServer();
    zone.name = "UTC";
    signedInAs(["my-account::update"]);

    render(<DefaultCountry />);
    await settle();

    expect(sent).toEqual([]);
  });

  it("draws nothing, even when the server refuses", async () => {
    countryServer(500);
    signedInAs(["my-account::update"]);

    const { container } = render(<DefaultCountry />);
    await settle();

    expect(container).toBeEmptyDOMElement();
  });
});
