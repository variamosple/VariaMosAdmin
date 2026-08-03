describe("Project Management - Real E2E Flows", () => {
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

  it("should show seeded project, update project name, and delete it", () => {
    cy.visit("http://localhost:3000");

    // 1. Log in as admin
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // 2. Navigate to Projects page
    cy.contains("Projects").click();
    cy.url().should("include", "/projects");

    // Verify seeded project exists
    cy.contains("tr", "Test Custom Project").should("be.visible");

    // 3. Edit project name
    cy.contains("tr", "Test Custom Project").within(() => {
      cy.get('button[title="Edit project"]').click();
    });

    cy.contains(".modal-title", "Edit a Project").should("be.visible");
    cy.contains(".modal", "Edit a Project").find('input[placeholder="Project name"]').clear({ force: true }).type("Test Custom Project Edited");

    cy.get(".modal-footer").contains("button", "Edit project").click();
    cy.get(".modal-title").should("not.exist");

    // Verify update is shown in table
    cy.contains("tr", "Test Custom Project Edited").should("be.visible");

    // 4. Delete project
    cy.contains("tr", "Test Custom Project Edited").within(() => {
      cy.get('button[title="Delete project"]').click();
    });

    cy.contains(".modal", "Are you sure you want to delete the project?").within(() => {
      cy.contains("button", "Accept").click();
    });

    // Verify it is removed from table
    cy.contains("tr", "Test Custom Project Edited").should("not.exist");
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
