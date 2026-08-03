describe("Microservices - Mocked E2E Flows", () => {
  const mockMicroservices = [
    {
      id: "ms-admin",
      names: ["ms-admin-api"],
      state: "running",
      status: "Up 2 hours",
      created: "2026-07-24T10:00:00Z"
    },
    {
      id: "ms-languages",
      names: ["ms-languages-api"],
      state: "exited",
      status: "Exited (1) 1 hour ago",
      created: "2026-07-24T10:00:00Z"
    }
  ];

  beforeEach(() => {
    Cypress.session.clearAllSavedSessions();
    cy.clearLocalStorage();
    cy.clearCookies();

    // Mock session info with microservices query permission
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
            permissions: ["micro-services::query"]
          }
        }
      }
    }).as("sessionInfo");
  });

  it("should monitor microservices, check statuses, and trigger control workflows", () => {
    // Intercept microservices list query
    cy.intercept("GET", "**/v1/micro-services*", {
      statusCode: 200,
      body: {
        data: mockMicroservices,
        totalItems: 2,
        totalPages: 1,
        currentPage: 1
      }
    }).as("getMicroservices");

    // Visit dashboard while pre-populating authToken to bypass login redirect
    cy.visit("http://localhost:3000/#/monitoring", {
      onBeforeLoad: (win) => {
        win.localStorage.setItem("authToken", "fake-jwt-token");
      }
    });
    cy.wait("@sessionInfo");
    cy.wait("@getMicroservices");

    cy.contains("h1", "Monitoring - Microservices list").should("be.visible");

    // Verify status details
    cy.contains("tr", "ms-admin").within(() => {
      cy.contains("td", "running").should("be.visible");
      cy.contains("td", "Up 2 hours").should("be.visible");
      // Stop button should exist for running microservice
      cy.get('button[title="Stop Microservice"]').should("be.visible");
      // Restart button should exist
      cy.get('button[title="Restart Microservice"]').should("be.visible");
    });

    cy.contains("tr", "ms-languages").within(() => {
      cy.contains("td", "exited").should("be.visible");
      // Start button should exist for exited microservice
      cy.get('button[title="Start Microservice"]').should("be.visible");
    });

    // Test stopping ms-admin via PUT
    cy.intercept("PUT", "**/v1/micro-services/ms-admin/stop", {
      statusCode: 200,
      body: { success: true }
    }).as("stopMs");

    cy.contains("tr", "ms-admin").within(() => {
      cy.get('button[title="Stop Microservice"]').click();
    });
    cy.contains("Are you sure you want to stop the microservice?").should("be.visible");
    cy.contains("button", "Accept").click();
    cy.wait("@stopMs");

    // Test starting ms-languages via PUT
    cy.intercept("PUT", "**/v1/micro-services/ms-languages/start", {
      statusCode: 200,
      body: { success: true }
    }).as("startMs");

    cy.contains("tr", "ms-languages").within(() => {
      cy.get('button[title="Start Microservice"]').click();
    });
    cy.contains("Are you sure you want to start the microservice?").should("be.visible");
    cy.contains("button", "Accept").click();
    cy.wait("@startMs");
  });
});
