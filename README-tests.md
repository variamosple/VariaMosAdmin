# Testing guide (VariaMosAdmin)

How the tests of the administration frontend are organised, written and run.

---

## The three layers

| Layer | Tool | Where | What it checks |
| --- | --- | --- | --- |
| Unit and component | Vitest 4, React Testing Library, jsdom | `src/**/*.test.ts(x)`, next to the code | Hooks, components, pages, domain helpers |
| HTTP doubles | msw 2 | `src/shared/tests/mocks/` (`server.ts`, `handlers.ts`) | The requests a component sends, and its reaction to the answers |
| End-to-end | Playwright | `tests/<feature>/*.spec.ts` | Whole journeys in a browser, against a mocked or a real backend |

Configuration: `vitest.config.mts` (setup file `src/setupTests.ts`), `playwright.config.ts`, `stryker.config.json`.

---

## Writing unit and component tests

- **Test what the user sees.** Query by role, label, placeholder or text (`screen.getByRole`, `getByLabelText`...), not by CSS class or component state.
- **Interact with `userEvent`.** Start with `const user = userEvent.setup()`, then `await user.click(...)`, `await user.type(...)`. Use `fireEvent` only when `userEvent` cannot reach the event.
- **Assert the effect, not the call alone.** Prefer `toHaveBeenCalledWith(...)` with the expected arguments to a bare `toHaveBeenCalled()`, and a visible text to `toBeTruthy()`.
- **Name the behaviour.** A test title says what happens ("keeps the refused edit with its reason"), and refers to the audit finding or evolution when there is one (`(UX-14)`, `(EV-31)`).

### HTTP requests

`src/setupTests.ts` starts the msw server with `onUnhandledRequest: "error"`: a request without a handler fails the test, since it would otherwise reach the network. Declare the answers a test needs with `server.use(http.get(...))`; `server.resetHandlers()` runs after each test.

### The component library

Components from `@variamosple/variamos-components` that need the application shell (session, page visits, router) are mocked. For new or modified tests, start from the shared factory, which keeps the **real** model classes (`ResponseModel`, `PagedModel`...) so that a test cannot drift from their shape:

```typescript
vi.mock("@variamosple/variamos-components", async () =>
  (await import("@/shared/tests/mocks/variamosComponents")).variamosComponents({
    Paginator: () => <div data-testid="paginator" />,
  }),
);
```

`withPageVisit` is a pass-through; add anything else the test uses (`Paginator`, `usePaginatedQuery`...) in the argument. Older tests still declare their own copy of the library; move them to the factory when you modify them.

### Other doubles

- `src/shared/tests/factories.ts`: builders of domain objects (`createUserMock(overrides)`).
- Mock a module with `vi.mock` at the top of the file, and read its functions with `vi.mocked(fn)` rather than a cast to `vi.Mock`.
- Wrap a component that uses the router in `<MemoryRouter>`.

---

## End-to-end tests

- `*.mocked.spec.ts`: the backend is replaced by `page.route(...)` answers.
- `*.real.spec.ts`: the real services and a test database (`docker-compose.test.yml`, data in `tests/db/`).
- `tests/helpers/`: login commands, TOTP codes, database helper.
- Prefer `page.getByRole` and `getByLabel` to CSS selectors.
- The e2e files are type-checked with the rest (`tsconfig.e2e.json`, run by `npm run typecheck`).

---

## Coverage and mutation

- `npm run test:coverage` measures every file of `src/`, apart from tests, mocks and start-up files. The thresholds in `vitest.config.mts` block a regression: raise them, never lower them.
- Stryker mutates the domain helpers and shared hooks (`stryker.config.json`). It is slow: the CI runs it every night.

---

## Commands

Prerequisite: Node 24 (`.nvmrc`, `.mise.toml`).

```bash
npm test                  # unit and component tests, once
npm run test:watch        # the same, on each change
npm run test:coverage     # with the coverage report and thresholds
npm run typecheck         # application, unit tests and e2e tests
npm run lint
npm run stryker           # mutation testing (long)
```

End-to-end tests need Docker:

```bash
npm run playwright:run:mocked   # frontend image, backend mocked
npm run playwright:run:real     # frontend and real services
```

`playwright:run:real` stops its containers with `npm run docker:test:down`, which also runs `docker image prune -f`: it removes every dangling image of the machine, not only those of the tests.
