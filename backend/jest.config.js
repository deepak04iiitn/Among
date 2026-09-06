/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  setupFiles: ['<rootDir>/test/setup.ts'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@schemas/(.*)$': '<rootDir>/schemas/$1',
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
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};

module.exports = config;
