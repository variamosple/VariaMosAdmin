describe("Metrics - Mocked E2E Flows", () => {
  const mockMetrics = [
    {
      id: "m1",
      title: "User Logins Over Time",
      chartType: "line",
      defaultFilter: "30days",
      filters: ["7days", "30days", "90days"],
      labelKey: "date",
      data: [
        ["date", "value"],
        ["2026-07-20", 15],
        ["2026-07-21", 25],
        ["2026-07-22", 40]
      ]
    },
    {
      id: "m2",
      title: "Users by Role Distribution",
      chartType: "pie",
      defaultFilter: "all",
      filters: [],
      labelKey: "role",
      data: [
        ["role", "value"],
        ["Admin", 2],
        ["User", 45]
      ]
    }
  ];

  beforeEach(() => {
    Cypress.session.clearAllSavedSessions();
    cy.clearLocalStorage();
    cy.clearCookies();

    // Mock session info with metrics query permission
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
            permissions: ["metrics::query"]
          }
        }
      }
    }).as("sessionInfo");
  });

  it("should render charts and date filters on the Metrics dashboard", () => {
    // Intercept metrics list query
    cy.intercept("GET", "**/v1/metrics", {
      statusCode: 200,
      body: {
        data: mockMetrics
      }
    }).as("getMetrics");

    // Visit dashboard while pre-populating authToken to bypass login redirect
    cy.visit("http://localhost:3000/#/metrics", {
      onBeforeLoad: (win) => {
        win.localStorage.setItem("authToken", "fake-jwt-token");
      }
    });
    cy.wait("@sessionInfo");
    cy.wait("@getMetrics");

    // Check header and titles
    cy.contains("h1", "Metrics").should("be.visible");
    cy.contains("h2", "User Logins Over Time").should("be.visible");
    cy.contains("h2", "Users by Role Distribution").should("be.visible");

    // Intercept filtering query using wildcard to match any query parameters (startDate/endDate)
    cy.intercept("GET", "**/v1/metrics/m1*", {
      statusCode: 200,
      body: {
        data: {
          ...mockMetrics[0],
          data: [
            ["date", "value"],
            ["2026-07-01", 5]
          ]
        }
      }
    }).as("filterMetric");

    // Click funnel button for User Logins Over Time
    cy.contains("h2", "User Logins Over Time")
      .parent()
      .find("button")
      .click();

    // Fill dates in popover
    cy.get('input[name="fromDate"]').type("2026-07-01");
    cy.get('input[name="toDate"]').type("2026-07-15");
    cy.contains("button", "Apply").click();

    cy.wait("@filterMetric");
  });
});
