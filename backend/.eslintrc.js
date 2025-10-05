module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': 'error',
    'curly': 'error',
    'no-multi-spaces': 'error',
    'no-trailing-spaces': 'error',
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always']
  }
};