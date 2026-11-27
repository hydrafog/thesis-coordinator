import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "dist/**",
      ".prototype/**",
      "coverage/**",
      "node_modules/**",
      "next-env.d.ts",
      "vitest.config.ts",
    ],
  },
];

export default config;
