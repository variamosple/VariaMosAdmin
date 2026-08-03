describe("Monitoring - Real E2E Flows", () => {
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

  it("should query local microservices and verify they are running", () => {
    cy.visit("http://localhost:3000");

    // 1. Log in as admin
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // 2. Navigate to Monitoring page
    cy.contains("button.p-0.nav-link", "Monitoring").click();
    cy.url().should("include", "/monitoring");

    // Check header
    cy.contains("h1", "Monitoring - Microservices list").should("be.visible");

    // Check that ms-admin exists and is running
    cy.contains("tr", "ms-admin").within(() => {
      cy.contains("td", "running").should("be.visible");
      cy.get('button[title="Stop Microservice"]').should("be.visible");
      cy.get('button[title="Restart Microservice"]').should("be.visible");
    });

    // Check that ms-languages exists and is running
    cy.contains("tr", "ms-languages").within(() => {
      cy.contains("td", "running").should("be.visible");
      cy.get('button[title="Stop Microservice"]').should("be.visible");
      cy.get('button[title="Restart Microservice"]').should("be.visible");
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
