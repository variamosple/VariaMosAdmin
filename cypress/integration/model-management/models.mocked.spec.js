describe("Model Management - Mocked Flows", () => {
  const mockModels = [
    {
      id: "1",
      name: "First Model",
      description: "This is the first mock model",
      author: "Author One",
      source: "Source One",
      engineeringType: "domain",
      projectName: "Project One",
      owners: [
        {
          id: "admin1",
          name: "Admin User",
          email: "admin@example.com",
          accessLevel: "OWNER"
        }
      ]
    },
    {
      id: "2",
      name: "Second Model",
      description: "This is the second mock model",
      author: "Author Two",
      source: "Source Two",
      engineeringType: "application",
      projectName: "Project Two",
      owners: []
    }
  ];

  beforeEach(() => {
    Cypress.session.clearAllSavedSessions();
    cy.clearLocalStorage();
    cy.clearCookies();

    // Mock session info with model query permission
    cy.intercept("GET", "**/auth/session-info", {
      statusCode: 200,
      body: {
        data: {
          user: {
            id: "admin1",
            user: "admin",
            name: "Admin User",
            email: "admin@example.com",
            roles: ["Admin"],
            permissions: ["admin::models::query"]
          }
        }
      }
    }).as("sessionInfo");

    // Mock query models
    cy.intercept("GET", "**/v1/admin/models*", {
      statusCode: 200,
      body: {
        data: mockModels,
        totalItems: 2,
        totalPages: 1,
        currentPage: 1
      }
    }).as("getModels");

    cy.visit("http://localhost:3000/#/models");
    cy.wait("@sessionInfo");
    cy.wait("@getModels");
  });

  it("should display models list with correct headers, rows, and allow details expansion", () => {
    cy.contains("h1", "Models list").should("be.visible");
    cy.get("table").should("be.visible");

    // First model row check
    cy.contains("tr", "First Model").within(() => {
      cy.contains("td", "This is the first mock model").should("be.visible");
      cy.contains("td", "Author One").should("be.visible");
      cy.contains("td", "Source One").should("be.visible");
      cy.contains("td", "domain").should("be.visible");
      cy.contains("td", "Project One").should("be.visible");
    });

    // Expand details
    cy.contains("tr", "First Model").within(() => {
      cy.get('button[title="Show/Hide model details"]').click();
    });

    // Verify details are displayed
    cy.contains("div.row", "Owners").within(() => {
      cy.contains("div", "Admin User (admin@example.com)").should("be.visible");
    });

    // Collapse details
    cy.contains("tr", "First Model").within(() => {
      cy.get('button[title="Show/Hide model details"]').click();
    });
    cy.contains("div", "Admin User (admin@example.com)").should("not.exist");
  });

  it("should perform dynamic filtering using debounced search field", () => {
    cy.intercept("GET", "**/v1/admin/models?*name=First*", {
      statusCode: 200,
      body: {
        data: [mockModels[0]],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1
      }
    }).as("searchModel");

    cy.get('input[placeholder="Search by model name or project name"]').type("First");
    cy.wait("@searchModel");

    cy.contains("tr", "First Model").should("be.visible");
    cy.contains("tr", "Second Model").should("not.exist");
  });

  it("should inspect modal validation and trigger successful update", () => {
    // Open edit model modal
    cy.contains("tr", "First Model").within(() => {
      cy.get('button[title="Edit model"]').click();
    });

    cy.contains(".modal-title", "Edit a Model").should("be.visible");
    cy.get('.modal input[placeholder="Model name"]').should("have.value", "First Model");

    // Clear name to test validation
    cy.get('.modal input[placeholder="Model name"]').clear();
    cy.contains("button", "Edit model").click();
    cy.contains("Model name is required").should("be.visible");

    // Type a new name
    cy.get('.modal input[placeholder="Model name"]').type("First Model Edited");

    // Mock successful update
    cy.intercept("PUT", "**/v1/admin/models/1", {
      statusCode: 200,
      body: {
        data: {
          ...mockModels[0],
          name: "First Model Edited"
        }
      }
    }).as("updateModel");

    cy.contains("button", "Edit model").click();
    cy.wait("@updateModel");

    // Verify modal closes
    cy.get(".modal-title").should("not.exist");
  });
});
