export default {
  testEnvironment: 'node',
  transform: {},
  testSequencer: '<rootDir>/tests/testSequencer.js',
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
};
