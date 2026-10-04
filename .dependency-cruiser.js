module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      comment: "Domain layers (in features and shared) must not depend on UI (components/pages/layouts) or API/infrastructure.",
      severity: "error",
      from: { path: "(^src/features/[^/]+/domain|^src/shared/domain)" },
      to: { path: "(^src/features/[^/]+/(components|pages|api)|^src/shared/(components|layouts|infrastructure))" }
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
