describe("Role & Permission Management - Real E2E Flows", () => {
  const adminEmail = "admin@variamos-test.com";
  const adminPassword = "Password123!";
  const dbHelperPath = "../support/db/adminDbHelper.js";
  const customRoleName = "Test Custom Role";

  beforeEach(() => {
    // Reset and seed database state
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "seedTestUsers"
    });
    // Clean any prior run roles
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestRoles"
    });
  });

  it("should create a new role, assign two permissions, and verify they persist on reload", () => {
    cy.visit("http://localhost:3000/variamos_admin/");

    // 1. Log in as admin
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/variamos_admin/#/");

    // 2. Navigate to Roles page
    cy.contains("Roles").click();
    cy.url().should("include", "/roles");

    // 3. Create a new Role
    cy.contains("button", "Create Role").click();
    cy.get('.modal-content').should('be.visible');
    cy.get('input[id="name"]').clear().type(customRoleName);
    cy.contains('.modal-footer button', 'Create role').click();

    // Verify it is added to the table
    cy.contains("td", customRoleName).should("be.visible");

    // 4. Go to details page of the newly created role
    cy.contains("tr", customRoleName).within(() => {
      cy.get('button[title="See role details"]').click();
    });
    cy.contains("h1", `${customRoleName} Role`).should("be.visible");

    // 5. Assign First Permission ("users::query")
    cy.get('button.form-select').click();
    cy.get('button.form-select input').clear().type("users::query");
    cy.get('.dropdown-menu button.dropdown-item').contains("users::query").click();
    cy.contains("button", "Add permission").click();

    // Verify first permission appears in list
    cy.contains("td", "users::query").should("be.visible");

    // 6. Assign Second Permission ("users::update")
    cy.get('button.form-select').click();
    cy.get('button.form-select input').clear().type("users::update");
    cy.get('.dropdown-menu button.dropdown-item').contains("users::update").click();
    cy.contains("button", "Add permission").click();

    // Verify second permission appears in list
    cy.contains("td", "users::update").should("be.visible");

    // 7. Reload page to verify persistence in DB
    cy.reload();
    cy.contains("h1", `${customRoleName} Role`).should("be.visible");
    cy.contains("td", "users::query").should("be.visible");
    cy.contains("td", "users::update").should("be.visible");
  });

  after(() => {
    // Cleanup roles and users
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestRoles"
    });
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestUsers"
    });
  });
});
