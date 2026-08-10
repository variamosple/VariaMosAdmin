describe("Language Management - Real E2E Flows", () => {
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
      functionName: "seedTestLanguages"
    });
  });

  it("should show seeded languages, update a language, and delete another", () => {
    cy.visit("http://localhost:3000/variamos_admin/");

    // 1. Log in as admin
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/variamos_admin/#/");

    // 2. Navigate to Languages page
    cy.contains("button.p-0.nav-link", "Languages").click();
    cy.url().should("include", "/languages");

    // Verify both seeded languages exist
    cy.contains("tr", "Test Custom Language Active").should("be.visible");
    cy.contains("tr", "Test Custom Language Pending").should("be.visible");

    // 3. Edit Active Language name and state
    cy.contains("tr", "Test Custom Language Active").within(() => {
      cy.get('button[title="Edit language"]').click();
    });

    cy.contains(".modal-title", "Edit a Language").should("be.visible");
    cy.contains(".modal", "Edit a Language").find('input[placeholder="Language name"]').clear({ force: true }).type("Test Custom Language Active Edited");
    cy.get('select[aria-label="State"]').select("PENDING");

    cy.get(".modal-footer").contains("button", "Edit language").click();
    cy.get(".modal-title").should("not.exist");

    // Verify update is shown in table
    cy.contains("tr", "Test Custom Language Active Edited").within(() => {
      cy.contains("td", "PENDING").should("be.visible");
    });

    // 4. Delete the Pending Language
    cy.contains("tr", "Test Custom Language Pending").within(() => {
      cy.get('button[title="Delete language"]').click();
    });

    cy.contains(".modal", "Are you sure you want to delete the language?").within(() => {
      cy.contains("button", "Accept").click();
    });

    // Verify it is removed from table
    cy.contains("tr", "Test Custom Language Pending").should("not.exist");
  });

  after(() => {
    // Cleanup
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestLanguages"
    });
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestUsers"
    });
  });
});
