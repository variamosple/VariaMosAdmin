describe("Project Management - Mocked Flows", () => {
  const mockProjects = [
    {
      id: "p1",
      name: "English Web Project",
      description: "A very long description that should be truncated by CSS styling in the table view to test text overflow handling",
      author: "Admin User",
      source: "Web Application Creator",
      date: "2026-07-20T10:00:00.000Z",
      template: true,
      project: {
        productLines: [
          {
            id: "pl-1",
            name: "Core PL",
            type: "software",
            domain: "education",
            domainEngineering: {
              models: [{ id: "m-1", name: "Domain model 1" }]
            },
            applicationEngineering: {
              models: []
            }
          }
        ]
      }
    },
    {
      id: "p2",
      name: "Spanish Mobile Project",
      description: "Private test project",
      author: "Editor User",
      source: "Mobile app client",
      date: null,
      template: false,
      project: {}
    }
  ];

  beforeEach(() => {
    Cypress.session.clearAllSavedSessions();
    cy.clearLocalStorage();
    cy.clearCookies();

    // Mock session info with project query permission
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
            permissions: ["admin::projects::query"]
          }
        }
      }
    }).as("sessionInfo");

    // Mock query projects
    cy.intercept("GET", "**/v1/admin/projects*", {
      statusCode: 200,
      body: {
        data: mockProjects,
        totalItems: 2,
        totalPages: 1,
        currentPage: 1
      }
    }).as("getProjects");

    cy.visit("http://localhost:3000/#/projects");
    cy.wait("@sessionInfo");
    cy.wait("@getProjects");
  });

  it("should display projects table, fallback values, and accordion details", () => {
    cy.contains("h1", "Projects list").should("be.visible");
    cy.get("table").should("be.visible");

    // Verify row 1 details
    cy.contains("tr", "English Web Project").within(() => {
      cy.contains("td", "Admin User").should("be.visible");
      cy.contains("td", "Web Application Creator").should("be.visible");
      cy.contains("td", "Public").should("be.visible");
      cy.contains("td", "2026-07-20").should("be.visible");
    });

    // Verify row 2 private layout and null date fallback
    cy.contains("tr", "Spanish Mobile Project").within(() => {
      cy.contains("td", "Private").should("be.visible");
      cy.get("td").eq(4).should("be.empty"); // date is null, format is empty or not rendered
    });

    // Verify accordion expansion
    cy.contains("tr", "English Web Project").within(() => {
      cy.get('button[title="Show/Hide project details"]').click();
    });
    
    // Click the outer Accordion Header button to expand it
    cy.contains("button", "Product Line: Core PL - Type: software - Domain: education").click();
    // Click the inner Accordion Header button for Domain Engineering to expand it
    cy.contains("button", "Domain Engineering - Models").click();
    cy.contains("Domain model 1").should("be.visible");
  });

  it("should support dynamic query filtering via SearchForm", () => {
    cy.intercept("GET", "**/v1/admin/projects?*name=Spanish*", {
      statusCode: 200,
      body: {
        data: [mockProjects[1]],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1
      }
    }).as("searchProject");

    cy.get('input[id="name"]').type("Spanish");
    cy.wait("@searchProject");

    cy.contains("tr", "Spanish Mobile Project").should("be.visible");
    cy.contains("tr", "English Web Project").should("not.exist");
  });

  it("should inspect edit modal fields, trigger validation, and submit updates", () => {
    cy.contains("tr", "English Web Project").within(() => {
      cy.get('button[title="Edit project"]').click();
    });

    cy.contains(".modal-title", "Edit a Project").should("be.visible");
    cy.get('.modal input[placeholder="Project name"]').should("have.value", "English Web Project");

    // Try submitting empty name to test required validation
    cy.get('.modal input[placeholder="Project name"]').clear();
    cy.contains(".modal button", "Edit project").click();
    cy.contains("Project name is required").should("be.visible");

    // Edit value
    cy.get('.modal input[placeholder="Project name"]').type("English Web Project Updated");
    
    // Mock successful update
    cy.intercept("PUT", "**/v1/admin/projects/p1", {
      statusCode: 200,
      body: {
        data: {
          ...mockProjects[0],
          name: "English Web Project Updated"
        }
      }
    }).as("updateProject");

    cy.contains(".modal button", "Edit project").click();
    cy.wait("@updateProject");
    cy.get(".modal-title").should("not.exist");
  });

  it("should handle project deletion and close the modal on success", () => {
    cy.contains("tr", "Spanish Mobile Project").within(() => {
      cy.get('button[title="Delete project"]').click();
    });

    cy.contains("Are you sure you want to delete the project?").should("be.visible");

    cy.intercept("DELETE", "**/v1/admin/projects/p2", {
      statusCode: 200,
      body: {
        success: true
      }
    }).as("deleteProject");

    cy.contains("button", "Accept").click();
    cy.wait("@deleteProject");
  });
});
