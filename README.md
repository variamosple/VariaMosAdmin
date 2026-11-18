# VariaMos Admin Dashboard (Frontend)

This is the admin dashboard frontend for the VariaMos project, built using React, TypeScript, PatternFly, and Bootstrap. The project adheres to Clean Architecture principles to keep components decoupled from the core business logic.

## Technology Stack

- **Framework**: React 19, built with Vite
- **Language**: TypeScript 6
- **UI Components**: PatternFly 6, Bootstrap 5 (react-bootstrap)
- **Testing**: Vitest, React Testing Library, msw, Playwright
- **Quality**: Biome (lint and format), dependency-cruiser, knip, Stryker

---

## Getting Started

### Prerequisites

- Node.js 26 (`.nvmrc`, `.mise.toml`)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd VariaMosAdmin
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```

### Running the Application

- To start the development server locally:
   ```bash
   npm start
   ```
- To build the application for production:
   ```bash
   npm run build
   ```

### Addresses and Docker image

The page reads its addresses from `AppConfig`: the `VITE_*` values of the build (`.env`), unless the container gives others at start-up.

- At each start, the container runs `etc/runtime-config.sh`. It writes `config.js`, which the page reads before the application, and the security headers of nginx, whose content security policy lists the origins of these addresses.
- A `VITE_*` variable given to the container replaces the value of the build; a variable given empty empties it; a variable not given keeps the value of the build. Without variables, the container serves exactly what the build gave.
- The same image therefore runs in production and in the development kit, which gives it the kit addresses:
   ```bash
   docker run -p 3000:3000 -e VITE_ADMIN_API_URL=http://localhost:8090/variamos_ms_admin <image>
   ```
- Variables: `VITE_ADMIN_API_URL`, `VITE_ADMIN_WS_URL`, `VITE_LANGUAGES_API_URL`, `VITE_PROJECTS_API_URL`, `VITE_NOTIFICATION_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_REDIRECT_URI`, `VITE_LOGIN_URL`, `VITE_HOME_PAGE` (`scripts/runtime-config.mjs`).

---

## Testing

The test layers, the rules for writing tests and the commands are in [README-tests.md](README-tests.md).

```bash
npm test                        # unit and component tests (Vitest)
npm run test:coverage           # with the coverage thresholds
npm run playwright:run:mocked   # end-to-end tests, backend mocked (Docker)
npm run playwright:run:real     # end-to-end tests, real services (Docker)
```

---

## Code Quality & Architecture

- **Lint and format** (Biome, warnings fail):
  ```bash
  npm run lint
  ```
- **Type checking** (application, unit tests and end-to-end tests):
  ```bash
  npm run typecheck
  ```
- **Architecture boundaries** (dependency-cruiser):
  ```bash
  npm run check-arch
  ```
- **Dead code** (knip; the CI fails on any unused file, export or dependency):
  ```bash
  npm run find-deadcode
  ```
- **Git hooks** (husky):
  - before a commit, the staged files of `src/` go through Biome and CSpell (`.lintstagedrc.json`);
  - before a push, `typecheck`, `lint` and `test` run under the Node version of `.nvmrc`.
