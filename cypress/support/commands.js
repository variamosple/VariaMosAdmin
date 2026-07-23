// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.request('POST', 'http://localhost:4000/auth/sign-in', { email, password })
      .then((response) => {
        const token = response.body.data.authToken;
        window.localStorage.setItem('authToken', token);
      });
  });
});

Cypress.Commands.add('disconnect', () => {
  cy.visit("http://localhost:3000/");
  cy.get('body').then(($body) => {
    if ($body.find('a#nav-dropdown').length > 0) {
      cy.get('a#nav-dropdown').click();
      cy.contains('a', 'Logout').click();
    }
  });
});

Cypress.Commands.add('loginViaUI', (email, password) => {
  cy.visit("http://localhost:3000/#/login");
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});



