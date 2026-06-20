// @ts-check
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist/**', '.angular/**', 'node_modules/**', 'coverage/**'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@angular-eslint': angular,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...angular.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.html'],
    plugins: { '@angular-eslint/template': angularTemplate },
    languageOptions: { parser: templateParser },
    rules: {
      ...angularTemplate.configs.recommended.rules,
    },
  },
];
