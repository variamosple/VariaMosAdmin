# VariaMos Admin Dashboard (Frontend)

This is the admin dashboard frontend for the VariaMos project, built using React, TypeScript, PatternFly, and Bootstrap. The project adheres to Clean Architecture principles to keep components decoupled from the core business logic.

## Technology Stack

- **Framework**: React 18
- **Language**: TypeScript
- **UI Components**: PatternFly 6, Bootstrap 5
- **Testing**: Jest, React Testing Library, Cypress

---

## Getting Started

### Prerequisites

- Node.js version 24 or greater

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd VariaMosAdmin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

- To start the development server locally (runs on port 3000 by default):
   ```bash
   npm start
   ```
- To build the application for production:
   ```bash
   npm run build
   ```

---

## Testing Guide

The testing suite consists of unit tests (Jest/React Testing Library) and End-to-End (E2E) tests (Cypress).

### 1. Unit Tests

Unit tests focus on component behavior and utility logic.
- **Run Unit Tests (interactive watch mode)**:
  ```bash
  npm run test
  ```
- **Generate Coverage Report**:
  ```bash
  npm run jest:coverage
  ```
  *For a detailed overview of test coverage exclusions and philosophy, see the [Guide des Tests Unitaires & Couverture](README-tests.md).*

### 2. End-to-End (E2E) Tests

We use Cypress for end-to-end user workflow validation. There are two execution modes:

#### A. Mocked E2E Tests (Recommended for CI & Local Development)
Runs the test suite inside isolated Docker containers using mocked API responses.
- **Run Mocked E2E Tests**:
  ```bash
  npm run cypress:run:mocked
  ```

#### B. Real E2E Tests (Integration)
Runs the test suite against a real local PostgreSQL container and dev environment.
- **Run Real E2E Tests**:
  ```bash
  npm run cypress:run:real
  ```

---

## Code Quality & Architecture

We enforce several linting and architectural boundaries:
- **Linting & Formatting**: Ensure code adheres to styling guidelines with ESLint and Prettier:
  ```bash
  npm run lint
  ```
- **Type Checking**: Verify TypeScript types without emitting code:
  ```bash
  npm run typecheck
  ```
- **Architecture Boundaries**: Ensure Clean Architecture layers (Domain, Infrastructure, EntryPoints) remain decoupled and follow dependency rules:
  ```bash
  npm run check-arch
  ```
- **Git Hooks**: Pre-commit hooks run automatically on changed files (Prettier, ESLint, CSpell) to prevent formatting errors from entering the repository.
