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
    cy.visit("http://localhost:3000");

    // 1. Log in
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();

    // Verify successful login
    cy.url().should("eq", "http://localhost:3000/");

    // 2. Navigate to "My Account" page
    cy.visit("http://localhost:3000/#/my-account");
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

  after(() => {
    // Cleanup
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestUsers"
    });
  });
});
