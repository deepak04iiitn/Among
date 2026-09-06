import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@schemas/(.*)$': '<rootDir>/schemas/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@jobs/(.*)$': '<rootDir>/jobs/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/index.ts',
    '!server.ts',
    '!app.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    // Auth & privacy modules require higher coverage
    './modules/auth/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './utils/privacyUtils.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './modules/moderation/**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};

export default config;
