describe("Metrics & Monitoring - Real E2E Flows", () => {
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
      functionName: "seedTestVisits"
    });
  });

  it("should retrieve and display real metric charts on the dashboard", () => {
    cy.visit("http://localhost:3000");

    // 1. Log in as admin
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // 2. Navigate to Metrics page
    cy.contains("button.p-0.nav-link", "Metrics").click();
    cy.url().should("include", "/metrics");

    // Check header
    cy.contains("h1", "Metrics").should("be.visible");

    // Verify real database metric titles are displayed
    cy.contains("Daily Unique Visits").should("be.visible");
    cy.contains("Daily Visits").should("be.visible");
    cy.contains("Monthly Visits").should("be.visible");
    cy.contains("Top visited pages (Last 3 Months)").should("be.visible");
    cy.contains("Yearly visits").should("be.visible");
  });

  after(() => {
    // Cleanup
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestVisits"
    });
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestUsers"
    });
  });
});
