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

- Node.js 24 (`.nvmrc`, `.mise.toml`)

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
- **Dead code** (knip):
  ```bash
  npm run find-deadcode
  ```
- **Git hooks** (husky):
  - before a commit, the staged files of `src/` go through Biome and CSpell (`.lintstagedrc.json`);
  - before a push, `typecheck`, `lint` and `test` run under the Node version of `.nvmrc`.
