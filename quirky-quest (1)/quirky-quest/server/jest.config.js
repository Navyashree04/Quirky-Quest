module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./__tests__/env.setup.js'],
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  testTimeout: 20000,
};
