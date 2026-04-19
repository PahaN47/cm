import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    { ignores: ['dist', 'node_modules', '*.config.*'] },

    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,

    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    {
        ...react.configs.flat.recommended,
        settings: { react: { version: 'detect' } },
    },
    react.configs.flat['jsx-runtime'],

    {
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },

    prettier,

    {
        rules: {
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-confusing-void-expression': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },
);
