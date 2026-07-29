import { globalIgnores } from 'eslint/config';

import nextPlugin from '@next/eslint-plugin-next';

export default [
  globalIgnores(['coverage/']),
  {
    plugins: {
      '@next/next': nextPlugin,
    },
  },
];