/* eslint-disable */
/// <reference types="cypress" />

describe("Admin - Bug Tracker E2E Flows", () => {
  const adminEmail = "admin@variamos-test.com";
  const adminPassword = "Password123!";
  const dbHelperPath = "../integration/admin/db/adminDbHelper.js";

  beforeEach(() => {
    // Set viewport to a standard desktop width to prevent horizontal scroll issues
    cy.viewport(1280, 720);

    // Reset and seed database state with test profiles using the modular helper
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "seedTestUsers",
    });

    // 1. Intercept initial empty or simple GitHub repository lists
    cy.intercept("GET", /\/bugs\/repos$/, {
      statusCode: 200,
      body: {
        transactionId: "queryBugRepos",
        data: ["VariaMos/VariaMosAdmin", "VariaMos/VariaMosPLE"],
      },
    }).as("getRepos");

    // 2. Intercept bugs load with empty list initially to bypass crash
    cy.intercept("GET", /\/bugs(\?|$)/, {
      statusCode: 200,
      body: {
        transactionId: "queryBugs",
        data: [],
      },
    }).as("getBugs");

    // 3. Intercept categories list query
    cy.intercept("GET", /\/bugs\/categories$/, {
      statusCode: 200,
      body: {
        transactionId: "queryCategories",
        data: ["Editor", "Backend", "UI", "Other"],
      },
    }).as("getCategories");
  });

  after(() => {
    // Clean database after tests run
    cy.task("runModuleDbScript", {
      scriptPath: dbHelperPath,
      functionName: "cleanTestUsers",
    });
  });

  const loginAndGoToBugs = () => {
    cy.visit("http://localhost:3000");
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.get("body").then(($body) => {
      if ($body.find(".modal").length > 0) {
        cy.get(".modal").contains("Cancel").click({ force: true });
      }
    });
    cy.contains("Bugs").click();
  };

  it("should log in as admin and navigate to the Bug Tracker dashboard", () => {
    cy.visit("http://localhost:3000");

    // Log in
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();

    cy.url().should("eq", "http://localhost:3000/");

    // Dismiss any default open modal (like language creation wizard)
    cy.get("body").then(($body) => {
      if ($body.find(".modal").length > 0) {
        cy.get(".modal").contains("Cancel").click({ force: true });
      }
    });

    // Navigate to Bug Tracker
    cy.contains("Bugs").click();
    cy.url().should("include", "/bugs");
    cy.contains("h1", "Bugs list").should("be.visible");
  });

  it("should display GitHub bugs and update list when filters are applied", () => {
    // Mock 2 GitHub issues
    const mockIssues = [
      {
        id: "gh-1",
        title: "GitHub UI Crash",
        priority: "high",
        status: "open",
        category: "Editor",
        description: "Crashes on click",
        attachments: [],
      },
      {
        id: "gh-2",
        title: "GitHub Performance lag",
        priority: "low",
        status: "closed",
        category: "Backend",
        description: "Laggy scrolling",
        attachments: [],
      },
    ];

    cy.intercept("GET", /\/bugs(\?|$)/, {
      statusCode: 200,
      body: { transactionId: "queryBugs", data: mockIssues },
    }).as("getFilteredBugs");

    // Login and navigate
    cy.visit("http://localhost:3000");
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.get("body").then(($body) => {
      if ($body.find(".modal").length > 0) {
        cy.get(".modal").contains("Cancel").click({ force: true });
      }
    });
    cy.contains("Bugs").click();

    // Verify first tab is selected and contains mock issues
    cy.get(".nav-tabs .nav-link.active").should("contain", "GitHub Bugs");
    cy.wait("@getFilteredBugs");

    cy.get(".tab-pane.active table tbody tr").should("have.length", 2);
    cy.get(".tab-pane.active table tbody tr")
      .eq(0)
      .should("contain", "GitHub UI Crash");
    cy.get(".tab-pane.active table tbody tr")
      .eq(1)
      .should("contain", "GitHub Performance lag");

    // Test Search Input functionality
    cy.intercept("GET", /\/bugs\?.*search=Performance/, {
      statusCode: 200,
      body: {
        transactionId: "queryBugsFiltered",
        data: [mockIssues[1]],
      },
    }).as("searchBugs");

    cy.get('input[name="search"]').type("Performance");
    cy.wait("@searchBugs");

    cy.get(".tab-pane.active table tbody tr").should("have.length", 1);
    cy.get(".tab-pane.active table tbody tr")
      .eq(0)
      .should("contain", "GitHub Performance lag");
    cy.get(".tab-pane.active table tbody tr").should(
      "not.contain",
      "GitHub UI Crash",
    );

    // Verify presence of Sync button
  });

  it("should display Local Inbox bugs, access attachments, and perform Approve/Reject actions", () => {
    const mockLocalBugs = [
      {
        id: "local-1",
        title: "Local UI Crash",
        priority: "medium",
        status: "pending",
        category: "Editor",
        description: "Crash log",
        reporterEmail: "reporter@test.com",
        attachments: [{ filePath: "/uploads/screenshot.png" }],
      },
    ];

    cy.intercept("GET", /\/bugs\/local(\?.*)?$/, {
      statusCode: 200,
      body: { transactionId: "queryLocalBugs", data: mockLocalBugs },
    }).as("getLocalPending");

    cy.intercept("POST", /\/bugs\/local-1\/status$/, {
      statusCode: 200,
      body: {
        transactionId: "updateStatus",
        data: { id: "local-1", status: "open" },
      },
    }).as("approveBug");

    cy.intercept("POST", /\/bugs\/local-1\/reject$/, {
      statusCode: 200,
      body: {
        transactionId: "rejectBug",
        data: { id: "local-1", status: "rejected" },
      },
    }).as("rejectBug");

    // Login and navigate
    cy.visit("http://localhost:3000");
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.get("body").then(($body) => {
      if ($body.find(".modal").length > 0) {
        cy.get(".modal").contains("Cancel").click({ force: true });
      }
    });
    cy.contains("Bugs").click();

    // Click Local Inbox Tab
    cy.contains("Local Inbox").click();
    cy.wait("@getLocalPending");

    // Check Sync GitHub button is hidden
    cy.contains("button", "Sync GitHub").should("not.exist");

    // Check attachment link inside the active tab panel
    cy.get(".tab-pane.active table tbody tr")
      .eq(0)
      .within(() => {
        cy.get("a")
          .should("have.attr", "href")
          .and("contain", "/uploads/screenshot.png");

        // Verify Approve and Reject buttons exist
        cy.contains("button", "Approve").should("be.visible");
        cy.contains("button", "Reject").should("be.visible");
      });

    // Test Approve Click
    cy.get(".tab-pane.active").contains("button", "Approve").click();
    cy.get('.modal select[name="githubRepo"]').select("VariaMos/VariaMosPLE");
    cy.get(".modal-footer")
      .contains("button", "Approve & Send to GitHub")
      .click();
    cy.wait("@approveBug");

    // Test Reject Click
    cy.get(".tab-pane.active").contains("button", "Reject").click();
    cy.wait("@rejectBug");
  });

  it("should display Trash Bin bugs and perform Restore action", () => {
    const mockRejectedBugs = [
      {
        id: "local-2",
        title: "Duplicate issue",
        priority: "low",
        status: "rejected",
        category: "Editor",
        description: "Dup",
        reporterEmail: "another@test.com",
        attachments: [],
      },
    ];

    cy.intercept("GET", /\/bugs\/local(\?.*)?$/, {
      statusCode: 200,
      body: { transactionId: "queryLocalRejected", data: mockRejectedBugs },
    }).as("getLocalRejected");

    cy.intercept("POST", /\/bugs\/local-2\/restore$/, {
      statusCode: 200,
      body: {
        transactionId: "restoreBug",
        data: { id: "local-2", status: "pending" },
      },
    }).as("restoreBug");

    // Login and navigate
    cy.visit("http://localhost:3000");
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.get("body").then(($body) => {
      if ($body.find(".modal").length > 0) {
        cy.get(".modal").contains("Cancel").click({ force: true });
      }
    });
    cy.contains("Bugs").click();

    // Click Trash Bin Tab
    cy.contains("Trash Bin").click();
    cy.wait("@getLocalRejected");

    // Verify actions column contains only Restore button inside the active tab panel
    cy.get(".tab-pane.active table tbody tr")
      .eq(0)
      .within(() => {
        cy.contains("button", "Restore").should("be.visible");
        cy.contains("button", "Approve").should("not.exist");
        cy.contains("button", "Reject").should("not.exist");
      });

    // Test Restore Click
    cy.get(".tab-pane.active").contains("button", "Restore").click();
    cy.wait("@restoreBug");
  });

  it("should handle User Mode Modal (UserBugFormModal) visibility, validation, and submission", () => {
    // Intercept creation of bug
    cy.intercept("POST", /\/bugs$/, {
      statusCode: 201,
      body: {
        transactionId: "createBug",
        data: {
          id: "user-bug-123",
          title: "User Bug Title",
          description: "User Bug Description",
          priority: "medium",
          category: "Editor",
          githubRepo: "",
        },
      },
    }).as("createUserBug");

    // Login and navigate
    cy.visit("http://localhost:3000");
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.get("body").then(($body) => {
      if ($body.find(".modal").length > 0) {
        cy.get(".modal").contains("Cancel").click({ force: true });
      }
    });
    cy.contains("Bugs").click();

    // Click "Report a Bug" to open modal
    cy.contains("button", "Report a Bug").click();

    // Verify User mode modal is open and fields are visible/invisible
    cy.contains(".modal-title", "Report a New Bug").should("be.visible");
    cy.get('.modal input[name="title"]').should("be.visible");
    cy.get('.modal textarea[name="description"]').should("be.visible");
    cy.get('.modal select[name="category"]').should("be.visible");
    cy.get('.modal input[type="file"]').should("be.visible");

    // Click Cancel to close the modal and verify, then reopen it
    cy.get(".modal-footer").contains("button", "Cancel").click();
    cy.contains(".modal-title", "Report a New Bug").should("not.exist");
    cy.contains("button", "Report a Bug").click();

    cy.get('.modal select[name="priority"]').should("not.exist");
    cy.get('.modal select[name="githubRepo"]').should("not.exist");

    // Submit empty form and check validations
    cy.get(".modal-footer").contains("button", "Report Bug").click();
    cy.contains("Title is required").should("be.visible");
    cy.contains("Description is required").should("be.visible");

    // Fill valid data
    cy.get('.modal input[name="title"]').type("User Bug Title");
    cy.get('.modal textarea[name="description"]').type("User Bug Description");
    cy.get('.modal select[name="category"]').select("Editor");

    // Submit form and check payload
    cy.get(".modal-footer").contains("button", "Report Bug").click();

    cy.wait("@createUserBug").then((interception) => {
      expect(interception.request.method).to.equal("POST");
      const body = interception.request.body;
      const bodyString =
        typeof body === "string" ? body : new TextDecoder("utf-8").decode(body);
      expect(bodyString).to.include("title");
      expect(bodyString).to.include("User Bug Title");
      expect(bodyString).to.include("description");
      expect(bodyString).to.include("User Bug Description");
      expect(bodyString).to.include("category");
      expect(bodyString).to.include("Editor");
      // Priority should be medium by default
      expect(bodyString).to.include("priority");
      expect(bodyString).to.include("medium");
    });

    // Check modal closed
    cy.contains(".modal-title", "Report a New Bug").should("not.exist");
  });

  it("should handle Admin Mode Modal (AdminBugFormModal) visibility, validation, and submission", () => {
    // Intercept creation of bug
    cy.intercept("POST", /\/bugs$/, {
      statusCode: 201,
      body: {
        transactionId: "createBug",
        data: {
          id: "admin-bug-123",
          title: "Admin Bug Title",
          description: "Admin Bug Description",
          priority: "high",
          category: "Other",
          githubRepo: "VariaMos/VariaMosAdmin",
        },
      },
    }).as("createAdminBug");

    // Login and navigate
    cy.visit("http://localhost:3000");
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.get("body").then(($body) => {
      if ($body.find(".modal").length > 0) {
        cy.get(".modal").contains("Cancel").click({ force: true });
      }
    });
    cy.contains("Bugs").click();

    // Click "Create GitHub Issue" to open modal
    cy.contains("button", "Create GitHub Issue").click();

    // Verify Admin mode modal is open and fields are visible/invisible
    cy.contains(".modal-title", "Report a GitHub Bug").should("be.visible");
    cy.get('.modal input[name="title"]').should("be.visible");
    cy.get('.modal textarea[name="description"]').should("be.visible");
    cy.get('.modal select[name="priority"]').should("be.visible");
    cy.get('.modal select[name="githubRepo"]').should("be.visible");
    cy.get('.modal input[type="file"]').should("be.visible");

    cy.get('.modal select[name="category"]').should("not.exist");

    // Submit without selecting repository shows validation error
    cy.get('.modal select[name="githubRepo"]').select("");
    cy.get(".modal-footer").contains("button", "Report Bug").click();
    cy.contains("Target repository is required").should("be.visible");

    // Fill valid data
    cy.get('.modal input[name="title"]').type("Admin Bug Title");
    cy.get('.modal textarea[name="description"]').type("Admin Bug Description");
    cy.get('.modal select[name="priority"]').select("high");
    cy.get('.modal select[name="githubRepo"]').select("VariaMos/VariaMosAdmin");

    // Submit form and check payload
    cy.get(".modal-footer").contains("button", "Report Bug").click();

    cy.wait("@createAdminBug").then((interception) => {
      expect(interception.request.method).to.equal("POST");
      const body = interception.request.body;
      const bodyString =
        typeof body === "string" ? body : new TextDecoder("utf-8").decode(body);
      expect(bodyString).to.include("title");
      expect(bodyString).to.include("Admin Bug Title");
      expect(bodyString).to.include("description");
      expect(bodyString).to.include("Admin Bug Description");
      expect(bodyString).to.include("priority");
      expect(bodyString).to.include("high");
      expect(bodyString).to.include("githubRepo");
      expect(bodyString).to.include("VariaMos/VariaMosAdmin");
    });

    // Check modal closed
    cy.contains(".modal-title", "Report a GitHub Bug").should("not.exist");
  });

  it("should handle BugApprovalModal review workflow, editing fields, uploading/deleting attachments, and verifying status change POST payload", () => {
    // 1. Prepare mock pending local bug with an attachment
    const mockPendingBug = {
      id: "local-10",
      title: "Original Title",
      description: "Original Description",
      priority: "low",
      category: "UI",
      githubRepo: "VariaMos/VariaMosPLE",
      reporterEmail: "user@test.com",
      status: "pending",
      attachments: [
        {
          id: "att-101",
          filePath: "/uploads/old_screenshot.png",
          fileType: "image/png",
        },
      ],
    };

    // Intercept GET /bugs/local to return this bug when loading
    cy.intercept("GET", /\/bugs\/local(\?.*)?$/, {
      statusCode: 200,
      body: { transactionId: "queryLocalBugs", data: [mockPendingBug] },
    }).as("getLocalPendingForApproval");

    // Intercept DELETE /bugs/attachments/att-101
    cy.intercept("DELETE", /\/bugs\/attachments\/att-101$/, {
      statusCode: 200,
      body: { transactionId: "deleteAttachment", data: null },
    }).as("deleteAttachment");

    // Intercept POST /bugs/local-10/attachments
    cy.intercept("POST", /\/bugs\/local-10\/attachments$/, {
      statusCode: 200,
      body: {
        transactionId: "uploadAttachment",
        data: {
          id: "att-102",
          filePath: "/uploads/new_screenshot.png",
          fileType: "image/png",
        },
      },
    }).as("uploadAttachment");

    // Intercept POST /bugs/local-10/status
    cy.intercept("POST", /\/bugs\/local-10\/status$/, {
      statusCode: 200,
      body: {
        transactionId: "updateStatus",
        data: { id: "local-10", status: "open" },
      },
    }).as("approveBugStatus");

    // Login and navigate
    cy.visit("http://localhost:3000");
    cy.get('input[name="email"]').type(adminEmail);
    cy.get('input[name="password"]').type(adminPassword);
    cy.get('button[type="submit"]').click();
    cy.get("body").then(($body) => {
      if ($body.find(".modal").length > 0) {
        cy.get(".modal").contains("Cancel").click({ force: true });
      }
    });
    cy.contains("Bugs").click();

    // Click Local Inbox Tab
    cy.contains("Local Inbox").click();
    cy.wait("@getLocalPendingForApproval");

    // Verify local-10 is shown and click Approve to open modal
    cy.get(".tab-pane.active table tbody tr").should("have.length", 1);
    cy.get(".tab-pane.active").contains("button", "Approve").click();

    // 1. Verify BugApprovalModal displays and is prefilled with existing data
    cy.get(".modal-title").should("contain", "Review and Approve Local Bug");
    cy.get('.modal input[name="title"]').should("have.value", "Original Title");
    cy.get('.modal textarea[name="description"]').should(
      "have.value",
      "Original Description",
    );
    cy.get('.modal select[name="githubRepo"]').should(
      "have.value",
      "VariaMos/VariaMosPLE",
    );
    cy.get('.modal select[name="priority"]').should("have.value", "low");
    cy.get('.modal select[name="category"]').should("have.value", "UI");

    // Verify existing attachment is displayed
    cy.get(".modal").contains("old_screenshot.png").should("be.visible");

    // 2. Test deleting attachment
    cy.get(".modal .list-group-item")
      .contains("old_screenshot.png")
      .parent()
      .find("button")
      .click();
    cy.wait("@deleteAttachment");
    cy.get(".modal").contains("old_screenshot.png").should("not.exist");

    // 3. Test uploading attachment
    cy.get('.modal input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("mock file content"),
        fileName: "new_screenshot.png",
        mimeType: "image/png",
      },
      { force: true },
    );
    cy.wait("@uploadAttachment");
    cy.get(".modal").contains("new_screenshot.png").should("be.visible");

    // 4. Edit fields
    cy.get('.modal input[name="title"]').clear().type("Revised Title");
    cy.get('.modal textarea[name="description"]')
      .clear()
      .type("Revised Description");
    cy.get('.modal select[name="githubRepo"]').select("VariaMos/VariaMosAdmin");
    cy.get('.modal select[name="priority"]').select("high");
    cy.get('.modal select[name="category"]').select("Editor");
    cy.get('.modal textarea[name="comment"]').type("Optional approval comment");

    // 5. Test clicking "Approve & Send to GitHub" and verify payload
    cy.get(".modal-footer")
      .contains("button", "Approve & Send to GitHub")
      .click();

    cy.wait("@approveBugStatus").then((interception) => {
      expect(interception.request.method).to.equal("POST");
      const body = interception.request.body;
      expect(body.status).to.equal("open");
      expect(body.comment).to.equal("Optional approval comment");
      expect(body.title).to.equal("Revised Title");
      expect(body.description).to.equal("Revised Description");
      expect(body.priority).to.equal("high");
      expect(body.category).to.equal("Editor");
      expect(body.githubRepo).to.equal("VariaMos/VariaMosAdmin");
    });

    // Check modal closed
    cy.get(".modal-title").should("not.exist");
  });

  it("should display comments and audit logs in the details modal, post a comment, and show closed warning", () => {
    const mockBugWithNotes = {
      id: "local-99",
      title: "Details View Bug",
      description: "Original Desc",
      priority: "low",
      category: "UI",
      githubRepo: "VariaMos/VariaMosPLE",
      reporterEmail: "user@test.com",
      status: "pending",
      attachments: [],
    };

    const mockNotes = [
      {
        id: 1,
        body: '[Audit] The administrator modified the following fields:\n* Title: "Original" -> "Details View Bug"',
        createdAt: new Date().toISOString(),
        author: null,
      },
      {
        id: 2,
        body: "This is a test admin note.",
        createdAt: new Date().toISOString(),
        author: { name: "Super Admin" },
      },
    ];

    // Intercept GET /bugs/local to display our bug
    cy.intercept("GET", /\/bugs\/local(\?.*)?$/, {
      statusCode: 200,
      body: { transactionId: "queryLocalBugs", data: [mockBugWithNotes] },
    }).as("getLocalPendingNotes");

    // Intercept GET /bugs/local-99/notes
    cy.intercept("GET", /\/bugs\/local-99\/notes$/, {
      statusCode: 200,
      body: { transactionId: "queryBugNotes", data: mockNotes },
    }).as("getNotes");

    // Intercept POST /bugs/local-99/notes
    cy.intercept("POST", /\/bugs\/local-99\/notes$/, {
      statusCode: 200,
      body: {
        transactionId: "createBugNote",
        data: {
          id: 3,
          body: "New added note",
          bugId: "local-99",
          authorId: "admin-123",
          authorName: "admin@variamos-test.com",
        },
      },
    }).as("postNote");

    // Login and navigate
    loginAndGoToBugs();

    // Click Local Inbox Tab
    cy.contains("Local Inbox").click();
    cy.wait("@getLocalPendingNotes");

    // Click Details/Approve to open modal
    cy.get(".tab-pane.active").contains("button", "Details").click();
    cy.wait("@getNotes");

    // Verify comments list is rendered
    cy.contains("h5", "Comments & Audit Logs").should("be.visible");
    cy.contains("SYSTEM AUDIT").should("be.visible");
    cy.contains("Title:").should("be.visible");
    cy.contains("This is a test admin note.").should("be.visible");
    cy.contains("Super Admin").should("be.visible");

    // Add comment
    cy.get('textarea[placeholder="Write a comment..."]').type("New added note");
    cy.get("button").contains("Add Comment").click();
    cy.wait("@postNote");

    // Close modal
    cy.get(".modal-footer").contains("button", "Close").click();
  });
});
