describe("User Management - Real E2E Flows", () => {
  const adminEmail = "admin@variamos-test.com";
  const adminPassword = "Password123!";
  const targetUserEmail = "user-test@variamos-test.com";
  const dbHelperPath = "../support/db/adminDbHelper.js";

  beforeEach(() => {
    // Reset and seed database state
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "seedTestUsers"
    });
  });

  it("should toggle active/disabled states for a test user, verifying UI updates and database persistence", () => {
    cy.visit("http://localhost:3000");

    // 1. Log in as admin
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // 2. Navigate to user list page
    cy.contains("Users").click();
    cy.url().should("include", "/users");

    // Search for target user
    cy.intercept("GET", "**/v1/users?*").as("usersSearch");
    cy.get('input[id="search"]').clear().type(targetUserEmail);
    cy.wait("@usersSearch");

    // Verify row is active
    cy.contains("tr", targetUserEmail).within(() => {
      cy.contains("td", "active").should("be.visible");
      // Disable user
      cy.get('button[title="Disable user"]').click();
    });

    // Confirm disable (using "Accept" as confirm button text in the modal)
    cy.contains("Are you sure you want to disable the user?").should("be.visible");
    cy.contains("button", "Accept").click();

    // Verify UI shows disabled status
    cy.contains("tr", targetUserEmail).within(() => {
      cy.contains("td", "disabled").should("be.visible");
    });

    // Check DB state using helper task
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "getUserState",
      args: targetUserEmail
    }).then((state) => {
      expect(state.isenabled).to.be.false;
    });

    // 3. Enable the user back
    cy.contains("tr", targetUserEmail).within(() => {
      cy.get('button[title="Enable user"]').click();
    });

    // Confirm enable
    cy.contains("Are you sure you want to enable the user?").should("be.visible");
    cy.contains("button", "Accept").click();

    // Verify UI shows active status
    cy.contains("tr", targetUserEmail).within(() => {
      cy.contains("td", "active").should("be.visible");
    });

    // Check DB state using helper task
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "getUserState",
      args: targetUserEmail
    }).then((state) => {
      expect(state.isenabled).to.be.true;
    });
  });

  after(() => {
    // Cleanup
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestUsers"
    });
  });
});
