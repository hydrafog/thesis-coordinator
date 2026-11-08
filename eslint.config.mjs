import nextConfig from "eslint-config-next/core-web-vitals";

const config = [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      ".prototype/**",
      "coverage/**",
      "node_modules/**",
      "next-env.d.ts",
      "vitest.config.ts",
    ],
  },
];

export default config;
