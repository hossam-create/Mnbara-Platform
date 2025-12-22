// ESLint configuration temporarily disabled due to version conflicts
// This legacy app uses Next.js 16 which is not compatible with current ESLint versions

import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  {
    ignores: [
      ".next/**",
      "out/**", 
      "build/**",
      "next-env.d.ts",
    ]
  }
]);

export default eslintConfig;
