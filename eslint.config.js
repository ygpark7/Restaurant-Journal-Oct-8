import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Our radio/file labels nest their text a few elements deep.
      'jsx-a11y/label-has-associated-control': ['error', { depth: 4 }],
    },
  },
  {
    // Components must only depend on repository interfaces, never on the mock implementation.
    // The single composition file (src/app/repositories.ts) and tests are the exceptions.
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/app/repositories.ts',
      'src/data/**',
      'src/test/**',
      '**/*.test.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/data/mock/**', '@/data/mock/**'],
              message:
                'Import repository interfaces from @/domain and use useRepositories(). Only src/app/repositories.ts may import the mock.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
