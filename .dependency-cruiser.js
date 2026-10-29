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
      name: "domain-uses-no-package",
      comment: "Domain layers depend on no npm package, the component library included: a new version of a package cannot change the domain.",
      severity: "error",
      from: { path: "(^src/features/[^/]+/domain|^src/shared/domain)", pathNot: "\\.test\\.tsx?$" },
      to: { dependencyTypesNot: ["local", "core"] }
    },
    {
      name: "features-keep-their-screens",
      comment: "A feature may use the domain and the API calls of another feature, never its screens: components, pages and hooks stay its own.",
      severity: "error",
      from: { path: "^src/features/([^/]+)/", pathNot: "\\.test\\.tsx?$" },
      to: { path: "^src/features/[^/]+/(components|pages|hooks)/", pathNot: "^src/features/$1/" }
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
