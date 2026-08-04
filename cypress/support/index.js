// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').callsFake((...args) => {
    cy.task('log', 'BROWSER CONSOLE ERROR: ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  });
  cy.stub(win.console, 'warn').callsFake((...args) => {
    cy.task('log', 'BROWSER CONSOLE WARN: ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  });
});


