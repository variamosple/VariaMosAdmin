describe("User Management - Mocked Flows", () => {
  const mockUsers = [
    {
      id: "u1",
      user: "john_doe",
      name: "John Doe",
      email: "john@example.com",
      isEnabled: true,
      isDeleted: false,
      createdAt: "2026-07-20T10:00:00Z",
      lastLogin: "2026-07-23T15:00:00Z"
    },
    {
      id: "u2",
      user: "jane_smith",
      name: "Jane Smith",
      email: "jane@example.com",
      isEnabled: false,
      isDeleted: false,
      createdAt: "2026-07-21T11:00:00Z",
      lastLogin: null
    }
  ];

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
            permissions: ["users::query", "users::update"]
          }
        }
      }
    }).as("sessionInfo");

    // Mock initial user list query (page 1)
    cy.intercept("GET", "**/v1/users*", {
      statusCode: 200,
      body: {
        data: mockUsers,
        totalItems: 2,
        totalPages: 1,
        currentPage: 1
      }
    }).as("getUsers");

    cy.visit("http://localhost:3000/#/users");
    cy.wait("@sessionInfo");
    cy.wait("@getUsers");
  });

  it("should display the user list, handle search input and pagination controls", () => {
    // Check page title and structure
    cy.contains("h1", "Users list").should("be.visible");
    cy.get("table").should("be.visible");

    // Check table headers
    cy.contains("th", "user").should("be.visible");
    cy.contains("th", "Name").should("be.visible");
    cy.contains("th", "Email").should("be.visible");
    cy.contains("th", "Status").should("be.visible");

    // Check loaded users
    cy.contains("td", "john_doe").should("be.visible");
    cy.contains("td", "john@example.com").should("be.visible");
    cy.contains("td", "jane_smith").should("be.visible");
    cy.contains("td", "jane@example.com").should("be.visible");

    // Mock search API response
    cy.intercept("GET", "**/v1/users?*search=john*", {
      statusCode: 200,
      body: {
        data: [mockUsers[0]],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1
      }
    }).as("searchUser");

    // Type in search bar
    cy.get('input[id="search"]').type("john");
    cy.wait("@searchUser");

    // Verify search filtered results
    cy.contains("td", "john_doe").should("be.visible");
    cy.contains("td", "jane_smith").should("not.exist");
  });

  it("should inspect user details, layout fields, and toggle active/disabled states", () => {
    // 1. Inspect user details
    cy.intercept("GET", "**/v1/users/u1", {
      statusCode: 200,
      body: {
        data: mockUsers[0]
      }
    }).as("getUserDetails");

    cy.intercept("GET", "**/v1/users/u1/roles*", {
      statusCode: 200,
      body: {
        data: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1
      }
    }).as("getUserRoles");

    cy.intercept("GET", "**/v1/roles*", {
      statusCode: 200,
      body: {
        data: []
      }
    }).as("getRoles");

    // Click "See user details" button for John Doe
    cy.contains("tr", "john_doe").within(() => {
      cy.get('button[title="See user details"]').click();
    });

    cy.wait("@getUserDetails");
    cy.wait("@getUserRoles");

    cy.contains("h1", "User information").should("be.visible");
    cy.contains("User Id:").parent().should("contain", "u1");
    cy.contains("Name:").parent().should("contain", "John Doe");
    cy.contains("Email:").parent().should("contain", "john@example.com");

    // Go back to user list
    cy.contains("button", "Back To User List").click();
    cy.url().should("include", "/users");

    // 2. Toggle active/disabled states
    // Intercept disable request
    cy.intercept("PUT", "**/v1/users/u1/disable", {
      statusCode: 200,
      body: {
        success: true
      }
    }).as("disableUser");

    // Click disable button for John Doe
    cy.contains("tr", "john_doe").within(() => {
      cy.get('button[title="Disable user"]').click();
    });

    // Confirmation modal should show
    cy.contains("Are you sure you want to disable the user?").should("be.visible");
    cy.contains("button", "Accept").click();
    cy.wait("@disableUser");

    // Intercept enable request
    cy.intercept("PUT", "**/v1/users/u2/enable", {
      statusCode: 200,
      body: {
        success: true
      }
    }).as("enableUser");

    // Click enable button for Jane Smith (since she is disabled)
    cy.contains("tr", "jane_smith").within(() => {
      cy.get('button[title="Enable user"]').click();
    });

    cy.contains("Are you sure you want to enable the user?").should("be.visible");
    cy.contains("button", "Accept").click();
    cy.wait("@enableUser");
  });
});
