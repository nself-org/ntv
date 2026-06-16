/**
 * Purpose: ESLint config for nTV (React Native + Expo, TypeScript).
 * Inputs:  src/**\/*.{ts,tsx}
 * Outputs: Lint pass/fail
 * Constraints: ESLint 8.x. Minimal for CI green gate.
 * SPORT: CI green gate
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    browser: false,
    node: true,
    es6: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-require-imports': 'warn',
    // Allow @ts-ignore in scaffolding-phase code (nTV is early-stage, many stubs)
    '@typescript-eslint/ban-ts-comment': 'warn',
    // react-hooks/exhaustive-deps referenced in code but plugin not configured here
    'react-hooks/exhaustive-deps': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'android/',
    'ios/',
    'dist/',
    'babel.config.js',
  ],
};
