describe("Role & Permission Management - Mocked Flows", () => {
  beforeEach(() => {
    Cypress.session.clearAllSavedSessions();
    cy.clearLocalStorage();
    cy.clearCookies();

    // Mock session info
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
            permissions: ["permissions::query", "roles::query", "roles::update"]
          }
        }
      }
    }).as("sessionInfo");
  });

  describe("Permission List", () => {
    const mockPermissions = [
      { id: 1, name: "users::query" },
      { id: 2, name: "users::update" },
      { id: 3, name: "roles::query" }
    ];

    beforeEach(() => {
      cy.intercept("GET", "**/v1/permissions*", {
        statusCode: 200,
        body: {
          data: mockPermissions,
          totalItems: 3,
          totalPages: 1,
          currentPage: 1
        }
      }).as("getPermissions");

      cy.visit("http://localhost:3000/#/permissions");
      cy.wait("@sessionInfo");
      cy.wait("@getPermissions");
    });

    it("should display permissions and allow searching", () => {
      cy.contains("h1", "Permissions list").should("be.visible");
      cy.contains("td", "users::query").should("be.visible");
      cy.contains("td", "roles::query").should("be.visible");

      // Mock search query
      cy.intercept("GET", "**/v1/permissions?*name=update*", {
        statusCode: 200,
        body: {
          data: [mockPermissions[1]],
          totalItems: 1,
          totalPages: 1,
          currentPage: 1
        }
      }).as("searchPermission");

      cy.get('input[id="search"]').type("update");
      cy.wait("@searchPermission");

      cy.contains("td", "users::update").should("be.visible");
      cy.contains("td", "users::query").should("not.exist");
    });
  });

  describe("Role List & Form Modal", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/v1/roles*", {
        statusCode: 200,
        body: {
          data: [
            { id: 10, name: "Administrator" },
            { id: 11, name: "Developer" }
          ],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1
        }
      }).as("getRoles");

      cy.visit("http://localhost:3000/#/roles");
      cy.wait("@sessionInfo");
      cy.wait("@getRoles");
    });

    it("should validate create role dialog input and handle errors", () => {
      // Open modal
      cy.contains("button", "Create Role").click();
      cy.get(".modal-title").should("contain", "Create a Role");

      // Submit empty name and assert validation error
      cy.get('.modal-footer button[type="submit"]').click();
      cy.contains("Role name is required").should("be.visible");

      // Mock API error response (e.g. role name already exists)
      cy.intercept("POST", "**/v1/roles", {
        statusCode: 400,
        body: {
          errorCode: 400,
          message: "Role name already exists"
        }
      }).as("createRoleFail");

      cy.get('input[id="name"]').clear().type("Administrator");
      cy.get('.modal-footer button[type="submit"]').click();
      cy.wait("@createRoleFail");

      // Modal should remain open
      cy.get(".modal-title").should("be.visible");

      // Close modal
      cy.contains("button", "Cancel").click();
      cy.get(".modal-title").should("not.exist");
    });
  });
});
