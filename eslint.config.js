// @ts-check
import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                project: 'tsconfig.json',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'default',
                    format: ['strictCamelCase'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                },
                {
                    selector: 'variableLike',
                    format: ['strictCamelCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                },
                {
                    selector: 'typeLike',
                    format: ['StrictPascalCase'],
                },
                {
                    selector: 'enumMember',
                    format: ['StrictPascalCase'],
                },
            ],
            'no-console': 'warn',
        },
    }
)
