module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      comment: "The Domain folder must not depend on any external layers (Infrastructure, DataProviders, or UI).",
      severity: "error",
      from: { path: "^src/Domain" },
      to: { path: "^src/Infrastructure|^src/DataProviders|^src/UI" }
    },
    {
      name: "no-circular-dependencies",
      comment: "Forbidden circular dependencies that can corrupt execution.",
      severity: "warn",
      from: {},
      to: {
        circular: true
      }
    }
  ],
  options: {
    doNotFollow: {
      path: "node_modules"
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json"
    }
  }
};
