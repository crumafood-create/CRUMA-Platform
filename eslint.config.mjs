import nextPlugin from '@next/eslint-plugin-next';
import storybook from 'eslint-plugin-storybook';
import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default [
  globalIgnores([
    '.next/',
    'coverage/',
    'node_modules/',
    'storybook-static/',
  ]),
  {
    plugins: {
      '@next/next': nextPlugin,
    },
  },
  {
    files: [
      '.storybook/**/*.{ts,tsx}',
      'src/**/*.stories.{ts,tsx}',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  ...storybook.configs['flat/recommended'],
];
