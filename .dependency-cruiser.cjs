module.exports = {
  forbidden: [
    { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
    {
      name: "ui-and-routes-no-data",
      severity: "error",
      from: { path: "^(app/|server/api/)" },
      to: { path: "(\\.repo\\.ts$|server/platform/(db|schema))" },
    },
    {
      name: "repos-no-services",
      severity: "error",
      from: { path: "\\.repo\\.ts$" },
      to: { path: "\\.service\\.ts$" },
    },
    {
      name: "platform-no-features",
      severity: "error",
      from: { path: "^server/platform/" },
      to: { path: "^server/features/" },
    },
    {
      name: "feature-boundaries",
      severity: "error",
      from: { path: "^server/features/([^/]+)/" },
      to: {
        path: "^server/features/",
        pathNot: ["^server/features/$1/", "\\.service\\.ts$"],
      },
    },
    {
      name: "db-only-in-repos",
      severity: "error",
      from: {
        path: "^server/features/",
        pathNot: ["\\.repo\\.ts$", "\\.test\\.ts$"],
      },
      to: { path: "^server/platform/(db|schema)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { extensions: [".ts", ".tsx", ".js", ".json"] },
  },
};
