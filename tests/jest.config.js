/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/fixtures/**',
    '!**/*.test.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@mnbarh/(.*)$': '<rootDir>/backend/services/$1/src'
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json'
    }
  },
  // Run tests in parallel for faster execution
  maxWorkers: '50%',
  // Ensure tests run sequentially when needed
  runInBand: false,
  // Configure test isolation
  resetMocks: true,
  clearMocks: true,
  restoreMocks: true,
  // Force exit after tests complete
  forceExit: true,
  // Detect open handles
  detectOpenHandles: true
};
