describe("Model Management - Real E2E Flows", () => {
  const adminEmail = "admin@variamos-test.com";
  const adminPassword = "Password123!";
  const dbHelperPath = "../support/db/adminDbHelper.js";

  beforeEach(() => {
    // Reset and seed database state
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "seedTestUsers"
    });
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "seedTestModels"
    });
  });

  it("should show seeded model, expand details, and edit the model name", () => {
    cy.visit("http://localhost:3000");

    // 1. Log in as admin
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // 2. Navigate to Models page
    cy.intercept('GET', '**/v1/admin/models*').as('getModels');
    cy.contains("button.p-0.nav-link", "Models").click();
    cy.url().should("include", "/models");
    cy.wait('@getModels');

    // Verify seeded model exists
    cy.contains("tr", "Test Custom Model").should("be.visible");

    // 3. Expand details
    cy.contains("tr", "Test Custom Model").within(() => {
      cy.get('button[title="Show/Hide model details"]').click();
    });
    cy.contains("div.row", "Project").within(() => {
      cy.contains("div", "Test Custom Project").should("be.visible");
    });

    // 4. Edit the model
    cy.contains("tr", "Test Custom Model").within(() => {
      cy.get('button[title="Edit model"]').click();
    });

    cy.contains(".modal-title", "Edit a Model").should("be.visible");
    cy.contains(".modal", "Edit a Model").find('input[placeholder="Model name"]').clear({ force: true }).type("Test Custom Model Edited");

    cy.get(".modal-footer").contains("button", "Edit model").click();
    cy.get(".modal-title").should("not.exist");

    // Verify update is shown in table
    cy.contains("tr", "Test Custom Model Edited").should("be.visible");
  });

  after(() => {
    // Cleanup
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestModels"
    });
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestUsers"
    });
  });
});
