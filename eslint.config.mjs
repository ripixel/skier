import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Fail on explicit `any` - use `unknown` instead
      '@typescript-eslint/no-explicit-any': 'error',
      // Fail on unused variables
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Allow empty functions in test mocks
      '@typescript-eslint/no-empty-function': 'off',
      // Allow non-null assertions sparingly
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  {
    // Relax rules for test files
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'public/', '*.cjs', '*.js'],
  },
);
