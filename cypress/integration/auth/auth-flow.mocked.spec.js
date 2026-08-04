describe("Auth - Comprehensive Mocked Flows", () => {
  beforeEach(() => {
    Cypress.session.clearAllSavedSessions();
    cy.clearLocalStorage();
    cy.clearCookies();

    // Default session mock (not logged in)
    cy.intercept("GET", "**/auth/session-info", {
      statusCode: 401,
      body: {
        errorCode: 401,
        message: "Your session has expired, please log in again."
      }
    }).as("sessionInfoDefault401");
  });

  describe("Sign In", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/#/login", {
        onBeforeLoad(win) {
          win.localStorage.clear();
          win.sessionStorage.clear();
        }
      });
    });

    it("should validate sign-in form inputs (empty values and syntax validation)", () => {
      // Empty check
      cy.get('button[type="submit"]').click();
      cy.contains("Email is required").should("be.visible");
      cy.contains("Password is required").should("be.visible");

      // Syntax check
      cy.get('input[name="email"]').type("invalid-email");
      cy.get('input[name="password"]').type("123");
      cy.get('button[type="submit"]').click();
      cy.url().should("include", "/login");
    });
  });

  describe("Sign Up", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/#/sign-up", {
        onBeforeLoad(win) {
          win.localStorage.clear();
          win.sessionStorage.clear();
        }
      });
    });

    it("should show validation errors for empty fields and password mismatch in sign-up", () => {
      // Click sign up with empty form
      cy.get('button[type="submit"]').click();
      cy.contains("Full name is required").should("be.visible");
      cy.contains("Email is required").should("be.visible");
      cy.contains("password is required").should("be.visible");
      cy.contains("Please confirm your password").should("be.visible");

      // Fill in details but with mismatching passwords
      cy.get('input[name="name"]').type("John Doe");
      cy.get('input[name="email"]').type("john@example.com");
      cy.get('input[name="password"]').type("Password123!");
      cy.get('input[name="passwordConfirmation"]').type("Different123!");
      cy.get('button[type="submit"]').click();

      cy.contains("Passwords do not match").should("be.visible");
    });
  });

  describe("Forgot Password", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/#/forgot-password", {
        onBeforeLoad(win) {
          win.localStorage.clear();
          win.sessionStorage.clear();
        }
      });
    });

    it("should validate input and redirect / show confirmation on success", () => {
      // Validate empty field
      cy.get('button[type="submit"]').click();
      cy.contains("Email is required").should("be.visible");

      // Mock success response
      cy.intercept("POST", "**/auth/forgot-password", {
        statusCode: 200,
        body: {
          success: true,
          message: "Email sent successfully"
        }
      }).as("forgotPasswordApi");

      cy.get('input[name="email"]').type("user@variamos-test.com");
      cy.get('button[type="submit"]').click();

      cy.wait("@forgotPasswordApi");
      cy.contains("If an account with this email exists, a password reset link has been sent. Please check your inbox!").should("be.visible");
    });
  });
});
