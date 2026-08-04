describe("Auth - Login Mocked Flows", () => {
  beforeEach(() => {
    // Clear all Cypress cached sessions
    Cypress.session.clearAllSavedSessions();
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Default mock: User is not logged in
    cy.intercept("GET", "**/auth/session-info", {
      statusCode: 401,
      body: {
        errorCode: 401,
        message: "Your session has expired, please log in again."
      }
    }).as("sessionInfoDefault401");

    // Visit with onBeforeLoad to clear window storage before any app code runs
    cy.visit("http://localhost:3000/#/login", {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.sessionStorage.clear();
      }
    });
  });

  it("should show validation errors for empty fields", () => {
    cy.get('button[type="submit"]').click();
    cy.contains("Email is required").should("be.visible");
    cy.contains("Password is required").should("be.visible");
  });

  it("should show error notification when sign-in fails (sad path)", () => {
    // Intercept POST request for sign-in and return a 401 error
    cy.intercept("POST", "**/auth/sign-in", {
      statusCode: 401,
      body: {
        errorCode: 401,
        message: "Invalid email or password"
      }
    }).as("failedSignIn");

    cy.get('input[name="email"]').type("wrong@variamos-test.com");
    cy.get('input[name="password"]').type("WrongPassword123!");
    cy.get('button[type="submit"]').click();

    cy.wait("@failedSignIn");
    // Verify that the error message is displayed on screen
    cy.contains("Invalid email or password").should("be.visible");
  });

  it("should log in successfully and redirect to the dashboard (happy path)", () => {
    // Dynamic mock for session-info to prevent early automatic login before typing
    let isLoggedIn = false;
    cy.intercept("GET", "**/auth/session-info", (req) => {
      if (isLoggedIn) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              user: {
                id: "1",
                user: "admin_test",
                name: "Admin Test",
                email: "admin@variamos-test.com",
                roles: ["Admin"],
              }
            }
          }
        });
      } else {
        req.reply({
          statusCode: 401,
          body: {
            errorCode: 401,
            message: "Your session has expired, please log in again."
          }
        });
      }
    }).as("sessionInfo");

    // Intercept successful sign-in and set state to logged-in
    cy.intercept("POST", "**/auth/sign-in", (req) => {
      isLoggedIn = true;
      req.reply({
        statusCode: 200,
        body: {
          data: {
            user: {
              id: "1",
              user: "admin_test",
              name: "Admin Test",
              email: "admin@variamos-test.com",
              roles: ["Admin"],
            },
            authToken: "mock-auth-token-1234"
          }
        }
      });
    }).as("successfulSignIn");

    // Intercept any initial data load on landing page to avoid exceptions
    cy.intercept("GET", "**/bugs/repos", { statusCode: 200, body: { data: [] } });
    cy.intercept("GET", "**/bugs*", { statusCode: 200, body: { data: [] } });
    cy.intercept("GET", "**/bugs/categories", { statusCode: 200, body: { data: [] } });
    cy.intercept("GET", "**/languages*", { statusCode: 200, body: { data: [] } });

    cy.get('input[name="email"]').type("admin@variamos-test.com");
    cy.get('input[name="password"]').type("Password123!");
    cy.get('button[type="submit"]').click();

    cy.wait("@successfulSignIn");
    cy.wait("@sessionInfo");

    // Check redirection to the dashboard
    cy.url().should("eq", "http://localhost:3000/");
  });

  it("should allow navigating to forgot password, validate empty input, and show success message on submit (mocked)", () => {
    // Navigate to forgot password page
    cy.contains("Forgot Password?").click();
    cy.url().should("include", "/forgot-password");

    // Submit empty email and verify validation error
    cy.get('button[type="submit"]').click();
    cy.contains("Email is required").should("be.visible");

    // Intercept forgot password API request
    cy.intercept("POST", "**/auth/forgot-password", {
      statusCode: 200,
      body: {
        success: true,
        message: "Email sent successfully"
      }
    }).as("forgotPasswordApi");

    // Fill email and submit
    cy.get('input[name="email"]').type("user@variamos-test.com");
    cy.get('button[type="submit"]').click();

    cy.wait("@forgotPasswordApi");

    // Verify success notification is shown
    cy.contains("If an account with this email exists, a password reset link has been sent. Please check your inbox!").should("be.visible");
  });
});

