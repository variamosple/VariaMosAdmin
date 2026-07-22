const path = require("path");
const cypress = require(path.join(__dirname, "node_modules/cypress"));
const defineConfig = cypress.defineConfig || (cypress.default && cypress.default.defineConfig);

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config);
    },
    specPattern: "cypress/integration/**/*.spec.js",
    supportFile: "cypress/support/index.js",
    baseUrl: "http://localhost:3000",
    blockHosts: [
      "*.google.com",
      "*.googleapis.com",
      "*.google-analytics.com",
      "*.googletagmanager.com"
    ]
  },
});
