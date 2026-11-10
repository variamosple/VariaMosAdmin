import { pageLoader } from "./PageLoader";

describe("pageLoader", () => {
  let location: {
    href: string;
    origin: string;
    pathname: string;
    search: string;
    hash: string;
    assign: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    location = {
      href: "https://app.example/variamos_admin/#/login",
      origin: "https://app.example",
      pathname: "/variamos_admin/",
      search: "",
      hash: "#/login",
      assign: vi.fn(),
      reload: vi.fn(),
    };
    vi.stubGlobal("location", location);
  });

  it("reloads when only the hash changes", () => {
    pageLoader.load("https://app.example/variamos_admin/#/home");

    expect(location.hash).toBe("#/home");
    expect(location.reload).toHaveBeenCalled();
    expect(location.assign).not.toHaveBeenCalled();
  });

  it("opens the same page without hash directly", () => {
    pageLoader.load("https://app.example/variamos_admin/");

    expect(location.assign).toHaveBeenCalledWith(
      "https://app.example/variamos_admin/",
    );
    expect(location.reload).not.toHaveBeenCalled();
  });

  it("opens another page directly", () => {
    pageLoader.load("https://other.example/editor/?authToken=x");

    expect(location.assign).toHaveBeenCalledWith(
      "https://other.example/editor/?authToken=x",
    );
    expect(location.reload).not.toHaveBeenCalled();
  });
});
