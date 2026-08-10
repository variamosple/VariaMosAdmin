describe("Auth - Real E2E Flows", () => {
  const adminEmail = "admin@variamos-test.com";
  const adminPassword = "Password123!";
  const dbHelperPath = "../support/db/adminDbHelper.js";

  beforeEach(() => {
    // Reset and seed database state
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "seedTestUsers"
    });
  });

  it("should log in with seeded admin credentials, verify local storage, update country in My Account, and verify persistence after reload", () => {
    cy.visit("http://localhost:3000/variamos_admin/");

    // 1. Log in
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();

    // Verify successful login
    cy.url().should("eq", "http://localhost:3000/variamos_admin/#/");

    // 2. Navigate to "My Account" page
    cy.visit("http://localhost:3000/variamos_admin/#/my-account");
    cy.contains("h1", "My account").should("be.visible");
    cy.contains("Email:").parent().should("contain", adminEmail);

    // Verify initial country is Colombia (since dbHelper.js seeds it with 'CO' which is Colombia)
    cy.contains("Country:").parent().should("contain", "Colombia");

    // 3. Edit personal information
    cy.contains("button", "Edit information").click();

    // Wait for the country list to load from the API
    cy.get('select[aria-label="Select your country"] option').should("have.length.gt", 1);

    // Select a new country (e.g. Andorra)
    cy.get('select[aria-label="Select your country"]').select("AD");
    cy.contains("button", "Update Information").click();

    // Verify modal closes and UI updates
    cy.contains("Country:").parent().should("contain", "Andorra");

    // 4. Reload page to verify backend persistence
    cy.reload();
    cy.contains("Country:").parent().should("contain", "Andorra");
  });

  it("should allow a new user to sign up, and then log in successfully with the new credentials", () => {
    const signupEmail = "new-signup-user@variamos-test.com";
    const signupName = "New Signed Up User";
    const signupPassword = "Password123!";

    cy.visit("http://localhost:3000/variamos_admin/#/sign-up");

    // Fill in sign-up details
    cy.get('input[name="name"]').type(signupName);
    cy.get('input[name="email"]').type(signupEmail);
    cy.get('input[name="password"]').type(signupPassword);
    cy.get('input[name="passwordConfirmation"]').type(signupPassword);

    // Submit
    cy.get('button[type="submit"]').click();

    // Check for success message or alert
    cy.get('.alert-success').should('be.visible');

    // Click link to navigate to sign-in page
    cy.contains("Sign in").click();
    cy.url().should("include", "/login");

    // Login with new credentials
    cy.get('input[name="email"]').type(signupEmail);
    cy.get('input[name="password"]').type(signupPassword);
    cy.get('button[type="submit"]').click();

    // Verify successful login (dashboard page)
    cy.url().should("eq", "http://localhost:3000/variamos_admin/#/");
  });

  after(() => {
    // Cleanup
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestUsers"
    });
  });
});
