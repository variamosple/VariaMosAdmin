import type * as Library from "@variamosple/variamos-components";

/**
 * The component library for a vi.mock factory: its real model classes
 * (ResponseModel...), so that a test cannot drift from their
 * shape, its real unsaved input, discard confirmation and dialog error
 * boundary of the forms, its texts and the opening of the bug form
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
  ...(await import(
    "@variamosple/variamos-components/dist/Components/DialogErrorBoundary/index.js"
  )),
  ...(await import("@variamosple/variamos-components/dist/Common/pageText.js")),
  ...(await import("@variamosple/variamos-components/dist/Common/Events.js")),
  openBugReport: (
    await import(
      "@variamosple/variamos-components/dist/Components/Header/useBugReport.js"
    )
  ).openBugReport,
});

export const variamosComponents = async (
  overrides: Partial<typeof Library> = {},
) => ({
  ...(await import("@variamosple/variamos-components/dist/Model/index.js")),
  ...(await formInput()),
  withPageVisit: <T>(component: T): T => component,
  ...overrides,
});
