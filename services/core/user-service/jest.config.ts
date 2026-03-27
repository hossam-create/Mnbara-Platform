import type { Config } from 'jest';

const config: Config = {
  displayName: 'user-service',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.types.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@mnbara/types$': '<rootDir>/../../packages/types/src',
    '^@mnbara/utils$': '<rootDir>/../../packages/utils/src',
    '^@mnbara/validation$': '<rootDir>/../../packages/validation/src',
    '^@mnbara/api-client$': '<rootDir>/../../packages/api-client/src'
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  verbose: true
};

export default config;
