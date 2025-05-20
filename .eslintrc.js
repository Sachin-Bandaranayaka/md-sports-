module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_' 
    }],
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-unsafe-declaration-merging': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'react/no-unescaped-entities': 'off',
    'import/no-anonymous-default-export': 'off',
    '@next/next/no-assign-module-variable': 'off'
  }
}; 