import type * as Library from "@variamosple/variamos-components";

/**
 * The component library for a vi.mock factory: its real model classes
 * (ResponseModel...), so that a test cannot drift from their
 * shape, its real unsaved input and discard confirmation of the forms
 * (formInput), and withPageVisit as a pass-through, since it needs the app
 * shell.
 * The full library is not loaded: it imports a stylesheet, which Node
 * cannot load in a mock factory. A test adds the rest it uses (Paginator,
 * usePaginatedQuery...) through `overrides`.
 *
 *   vi.mock("@variamosple/variamos-components", async () =>
 *     (await import("@/shared/tests/mocks/variamosComponents"))
 *       .variamosComponents(),
 *   );
 */
export const formInput = async () => ({
  ...(await import(
    "@variamosple/variamos-components/dist/Hooks/unsavedInput.js"
  )),
  ...(await import(
    "@variamosple/variamos-components/dist/Components/DiscardInput/index.js"
  )),
});

export const variamosComponents = async (
  overrides: Partial<typeof Library> = {},
) => ({
  ...(await import("@variamosple/variamos-components/dist/Model/index.js")),
  ...(await formInput()),
  withPageVisit: <T>(component: T): T => component,
  ...overrides,
});
