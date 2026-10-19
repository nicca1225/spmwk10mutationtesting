// Q4 only: runs Gemini's tests for the Q4 module (q4/tests).
/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }] },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageReporters: ['text', 'html'],
  coverageDirectory: '<rootDir>/../reports/q4-coverage',
};
