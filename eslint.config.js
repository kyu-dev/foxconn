// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['node_modules/', '.mastra/', 'dist/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js', 'vitest.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
    },
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
  },
  // Layer boundaries (see architecture.md): dependencies point inward only 
  {
    files: ['src/domain/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '^(?!zod(/|$)|\\./)',
          message: 'domain/ is pure: it may only import zod and other domain/ files (./).',
        }],
      }],
    },
  },
  {
    files: ['src/infrastructure/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '^(\\.\\./)+mastra(/|$)',
          message: 'infrastructure/ must not import the application layer (src/mastra/).',
        }],
      }],
    },
  },
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
)
