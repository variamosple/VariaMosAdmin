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

let browserLogs = [];

Cypress.on('window:before:load', (win) => {
  const originalError = win.console.error;
  const originalWarn = win.console.warn;

  win.console.error = (...args) => {
    originalError.apply(win.console, args);
    browserLogs.push('ERROR: ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  };

  win.console.warn = (...args) => {
    originalWarn.apply(win.console, args);
    browserLogs.push('WARN: ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  };
});

afterEach(() => {
  if (browserLogs.length > 0) {
    cy.task('log', '\n--- BROWSER CONSOLE LOGS FROM TEST ---\n' + browserLogs.join('\n') + '\n-------------------------------------\n');
    browserLogs = [];
  }
});



