describe("Bug Tracker - Real DB E2E Flows", () => {
  const adminEmail = "admin@variamos-test.com";
  const adminPassword = "Password123!";
  const dbHelperPath = "../support/db/adminDbHelper.js";

  beforeEach(() => {
    // Reset and seed database
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "seedTestUsers",
    });
  });

  it("should persist a new bug in the database and support commenting in the details view", () => {
    // 1. Visit and perform login via UI helper
    cy.loginViaUI(adminEmail, adminPassword);

    // Dismiss initial wizards/modals if present
    cy.get("body").then(($body) => {
      if ($body.find(".modal").length > 0) {
        cy.get(".modal").contains("Cancel").click({ force: true });
      }
    });

    // 2. Navigate to Bug Tracker
    cy.contains("Bugs").click();
    cy.url().should("include", "/bugs");

    // 3. Open Report a Bug Modal
    cy.contains("button", "Report a Bug").click();
    cy.contains(".modal-title", "Report a New Bug").should("be.visible");

    // 4. Fill form
    const bugTitle = "Real Database Bug Test " + Date.now();
    cy.get('.modal input[name="title"]').type(bugTitle);
    cy.get('.modal textarea[name="description"]').type("This bug was created in a real integration test.");
    cy.get('.modal select[name="category"]').select("Editor");

    // 5. Submit bug
    cy.get(".modal-footer").contains("button", "Report Bug").click();

    // 6. Check that the bug appears in the Local Inbox
    cy.contains("Local Inbox").click();
    cy.get(".tab-pane.active").contains("table tbody tr", bugTitle).should("be.visible");

    // 7. Click Details to open comments/audit logs view
    cy.get(".tab-pane.active").contains("tr", bugTitle).within(() => {
      cy.contains("button", "Details").click();
    });

    // Verify modal elements are visible
    cy.contains("h5", "Comments & Audit Logs").should("be.visible");
    cy.contains("No comments or logs recorded yet.").should("be.visible");

    // 8. Post a new comment
    const testComment = "Verification comment for database persistence " + Date.now();
    cy.get('textarea[placeholder="Write a comment..."]').type(testComment);
    cy.get("button").contains("Add Comment").click();

    // Verify it is added to the list
    cy.contains(testComment).should("be.visible");

    // Close the details modal
    cy.get(".modal-footer").contains("button", "Close").click();

    // Reopen details and verify persistence
    cy.get(".tab-pane.active").contains("tr", bugTitle).within(() => {
      cy.contains("button", "Details").click();
    });
    cy.contains(testComment).should("be.visible");

    // Close details modal
    cy.get(".modal-footer").contains("button", "Close").click();
  });

  after(() => {
    // Cleanup database
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestUsers",
    });
  });
});
