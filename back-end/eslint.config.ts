import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        ignores: ['dist', 'node_modules'],
    }
);
