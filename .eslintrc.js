module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['react', '@typescript-eslint', 'react-hooks'],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Prevent common React errors
    'react/prop-types': 'off', // We use TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/display-name': 'off', // Often causes issues with HOCs
    'react/no-unescaped-entities': 'warn', // Prevent unescaped HTML entities, but only warn for now
    'react/jsx-no-target-blank': 'error', // Security: Prevent target="_blank" without rel="noreferrer"
    'react/jsx-key': 'error', // Ensure array elements have keys
    
    // Prevent common TypeScript errors
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-inferrable-types': 'warn', // Prevent redundant type annotations, but only warn for now
    '@typescript-eslint/no-empty-interface': 'warn', // Warn about empty interfaces
    '@typescript-eslint/consistent-type-assertions': ['error', { // Enforce consistent type assertions
      assertionStyle: 'as',
      objectLiteralTypeAssertions: 'allow-as-parameter',
    }],
    
    // Enforce consistent component patterns
    'react/function-component-definition': [
      'warn',
      {
        namedComponents: 'function-declaration',
        unnamedComponents: 'arrow-function',
      },
    ],
    
    // Enforce hook rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Other rules
    'no-useless-escape': 'warn', // Warn about unnecessary escape characters
    'prefer-const': 'warn', // Prefer const over let when possible
  },
};
