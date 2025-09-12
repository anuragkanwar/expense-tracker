import baseConfig from "@pocket-pixie/eslint-config/base.mjs";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  ...baseConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Prevent reintroducing local models/dto folders (now provided by @pocket-pixie/contracts)
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/models",
              message:
                "Use @pocket-pixie/contracts directly (alias already points there).",
            },
            {
              name: "@/dto",
              message: "Use @pocket-pixie/contracts (dto exported there).",
            },
          ],
          patterns: ["@/models/*", "@/dto/*"],
        },
      ],
    },
  },
];
