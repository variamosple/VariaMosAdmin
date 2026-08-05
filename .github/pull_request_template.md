## Description
Provide a brief summary of the changes introduced by this Pull Request, including the motivation or context.

### Key Changes
- [First major change / UI component added]
- [Second major change / bug fixed]

## Related Issue / Ticket
If applicable, link the related issue or ticket here (e.g., Closes #123).

## How to Test
Describe the steps required to verify and test the changes.
1. Run `npm install` to ensure all packages are up to date.
2. Start the development server (`npm run start`).
3. [Insert specific user flows, page URLs, or UI testing steps here]

## Checklist
Before submitting this Pull Request, please ensure you have completed the following checks:
- [ ] My code compiles and builds successfully without errors (`npm run build`).
- [ ] I have verified TypeScript types (`npm run typecheck`).
- [ ] I have run the linter and formatted my code (`npm run lint`).
- [ ] All unit tests pass successfully (`npm run test`).
- [ ] I have run and passed the mocked E2E tests (`npm run cypress:run:mocked`).
- [ ] I have run and passed the real E2E integration tests (`npm run cypress:run:real`) if modifying backend-connected components.
- [ ] I have added or updated unit, integration, or E2E tests to cover the new features or UI components.
- [ ] I have verified that Clean Architecture boundaries are respected (`npm run check-arch`).
