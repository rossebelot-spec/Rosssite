import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextConfigs = require("eslint-config-next/core-web-vitals");

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".claude/**",
      "ipolitics/**",
      "cowork-bridge/**",
    ],
  },
  ...nextConfigs,
];

export default eslintConfig;
