import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  rootDir: 'src',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@schemas/(.*)$': '<rootDir>/schemas/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@features/(.*)$': '<rootDir>/features/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@store/(.*)$': '<rootDir>/store/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/index.{ts,tsx}',
    '!app/**',
    '!**/*.d.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './features/auth/**/*.{ts,tsx}': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};

export default createJestConfig(config);
