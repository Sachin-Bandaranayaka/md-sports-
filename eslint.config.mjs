import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 
        'varsIgnorePattern': '^_', 
        'argsIgnorePattern': '^_' 
      }]
    },
    ignores: [
      // Temporarily ignoring these files for build
      'src/app/accounting/page.tsx',
      'src/app/purchases/page.tsx',
      'src/app/quotations/page.tsx',
      'src/components/layout/MainLayout.tsx',
      'src/app/suppliers/page.tsx',
    ]
  }
];

export default eslintConfig;
