# Unit Testing & Coverage Guide (VariaMosAdmin)

This guide provides developers with the essential principles, rules, and commands to maintain and extend the unit testing suite.

---

## Testing Philosophy

We follow modern testing practices using **Jest** and **React Testing Library (RTL)**:
- **Test User-Visible Behavior**: Query components based on how users interact with them (preferring `screen.getByRole`, `screen.getByPlaceholderText`, `screen.getByLabelText`, or `screen.getByText`). Avoid relying on internal implementation details like local states or direct DOM class selectors.
- **Use `userEvent` over `fireEvent`**: RTL recommends using `@testing-library/user-event` to simulate real browser interactions. Always initialize interactions with `const user = userEvent.setup()`.
- **Decoupled Business Logic**: Keep React components focused on rendering and UI behavior, keeping core business logic decoupled.

---

## Mocking & Routing Best Practices

### 1. Mocking External Components
If you encounter ESM-related import errors in Jest with third-party libraries, mock them at the top of your test file:
```typescript
jest.mock("@variamosple/variamos-components", () => ({
  useSession: jest.fn(),
  PagedModel: class PagedModel {},
}));
```

### 2. Wrapping Router Dependencies
If the component under test contains navigation links or hooks (`Link`, `useNavigate`), wrap the rendered component inside a `<MemoryRouter>`:
```typescript
import { MemoryRouter } from "react-router-dom";

render(
  <MemoryRouter>
    <LoginForm onSignIn={mockOnSignIn} />
  </MemoryRouter>,
);
```

---

## Jest Coverage Configuration & Exclusions

To maintain realistic and meaningful coverage metrics, files and directories containing no business or testing logic are excluded (configured in the `"jest"` section of `package.json`):

1. **Entities & Typings**: Plain TypeScript interfaces and pure types (`*.types.ts`, `WithPagination.tsx`, `domain/Entity/**`).
2. **Static Layouts & Views**: Plain textual components like the `About/` directory or static templates.
3. **Repository Wrappers**: Direct API Axios wrappers ending in `*Repository.ts` (e.g., `BugRepository.ts`, `MetricsRepository.ts`).

### Rule for Adding Code:
- **Interceptors & Custom Network Logic**: If you develop dynamic logic inside `/api/` (e.g., caching interceptors, global error handlers, security token insertion), **do not name the file `*Repository.ts`**. By keeping it standard, it will automatically be included in the coverage report, reminding you to write unit/integration tests for that logic.

---

## Helpful Commands

- **Run unit tests locally (watch mode)**:
  ```bash
  npm run test
  ```
- **Run tests and generate coverage report**:
  ```bash
  npm run jest:coverage
  ```
- **Simulate CI verification (type check + non-interactive tests)**:
  ```bash
  npm run typecheck && CI=true npm run test
  ```
