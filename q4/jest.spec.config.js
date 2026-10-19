// Q4 only: runs the human-written checks against SPEC.md (q4/spec-checks).
/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  roots: ['<rootDir>/spec-checks'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }] },
};
