describe("Language Management - Mocked Flows", () => {
  const mockLanguages = [
    {
      id: 1,
      name: "English",
      type: "VariaMos",
      stateAccept: "ACTIVE",
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-07-20T11:00:00.000Z",
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
      id: 2,
      name: "Spanish",
      type: "VariaMos",
      stateAccept: "PENDING",
      createdAt: undefined,
      updatedAt: undefined,
      owners: []
    }
  ];

  beforeEach(() => {
    Cypress.session.clearAllSavedSessions();
    cy.clearLocalStorage();
    cy.clearCookies();

    // Mock session info with language query permission
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
            permissions: ["admin::languages::query"]
          }
        }
      }
    }).as("sessionInfo");

    // Mock query languages
    cy.intercept("GET", "**/v1/admin/languages*", {
      statusCode: 200,
      body: {
        data: mockLanguages,
        totalItems: 2,
        totalPages: 1,
        currentPage: 1
      }
    }).as("getLanguages");

    cy.visit("http://localhost:3000/#/languages");
    cy.wait("@sessionInfo");
    cy.wait("@getLanguages");
  });

  it("should display languages list with correct headers, rows, and fallback for null dates", () => {
    cy.contains("h1", "Languages list").should("be.visible");
    cy.get("table").should("be.visible");

    // English language row with owner and formatted dates
    cy.contains("tr", "English").within(() => {
      cy.contains("td", "VariaMos").should("be.visible");
      cy.contains("td", "ACTIVE").should("be.visible");
      cy.contains("td", "Admin User").should("be.visible");
      cy.contains("td", "2026-07-20").should("be.visible");
    });

    // Spanish language row verifying N/A fallback for null dates
    cy.contains("tr", "Spanish").within(() => {
      cy.contains("td", "PENDING").should("be.visible");
      // The columns for dates should show N/A
      cy.get("td").eq(4).should("contain", "N/A"); // createdAt
      cy.get("td").eq(5).should("contain", "N/A"); // updatedAt
    });
  });

  it("should perform dynamic filtering using debounced search field", () => {
    cy.intercept("GET", "**/v1/admin/languages?*name=Eng*", {
      statusCode: 200,
      body: {
        data: [mockLanguages[0]],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1
      }
    }).as("searchLanguage");

    cy.get('input[id="name"]').type("Eng");
    cy.wait("@searchLanguage");

    cy.contains("tr", "English").should("be.visible");
    cy.contains("tr", "Spanish").should("not.exist");
  });

  it("should inspect modal validation and trigger successful update", () => {
    // Open edit language modal
    cy.contains("tr", "English").within(() => {
      cy.get('button[title="Edit language"]').click();
    });

    cy.contains(".modal-title", "Edit a Language").should("be.visible");
    cy.get('.modal input[placeholder="Language name"]').should("have.value", "English");

    // Clear input to test client side required validation
    cy.get('.modal input[placeholder="Language name"]').clear();
    cy.contains("button", "Edit language").click();
    cy.contains("Language name is required").should("be.visible");

    // Retype name
    cy.get('.modal input[placeholder="Language name"]').type("English Edited");

    // Mock successful update
    cy.intercept("PUT", "**/v1/admin/languages/1", {
      statusCode: 200,
      body: {
        data: {
          ...mockLanguages[0],
          name: "English Edited"
        }
      }
    }).as("updateLanguage");

    cy.contains("button", "Edit language").click();
    cy.wait("@updateLanguage");

    // Verify modal closes
    cy.get(".modal-title").should("not.exist");
  });

  it("should handle language deletion with confirmation modal", () => {
    cy.contains("tr", "Spanish").within(() => {
      cy.get('button[title="Delete language"]').click();
    });

    cy.contains("Are you sure you want to delete the language?").should("be.visible");

    // Mock delete request
    cy.intercept("DELETE", "**/v1/admin/languages/2", {
      statusCode: 200,
      body: {
        success: true
      }
    }).as("deleteLang");

    // Confirm deletion
    cy.contains("button", "Accept").click();
    cy.wait("@deleteLang");
  });
});
