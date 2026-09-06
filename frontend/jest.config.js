const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  rootDir: 'src',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$':           '<rootDir>/$1',
    '^@constants/(.*)$':  '<rootDir>/constants/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@features/(.*)$':   '<rootDir>/features/$1',
    '^@hooks/(.*)$':      '<rootDir>/hooks/$1',
    '^@store/(.*)$':      '<rootDir>/store/$1',
    '^@lib/(.*)$':        '<rootDir>/lib/$1',
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/index.{ts,tsx}',
    '!app/**',
    '!**/*.d.ts',
    '!constants/**',
    '!types/**',
  ],
  coverageThreshold: {
    global: {
      branches:   70,
      functions:  75,
      lines:      75,
      statements: 75,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};

module.exports = createJestConfig(config);
