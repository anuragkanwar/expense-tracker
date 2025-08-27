
import baseConfig from "./base.mjs";
import eslintReact from "@eslint-react/eslint-plugin";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  ...baseConfig,
  eslintReact.configs.recommended,
];

export default config;
