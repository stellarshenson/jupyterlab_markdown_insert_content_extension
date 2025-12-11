/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  // Increase timeout for environments with many extensions
  timeout: 120 * 1000,
  expect: {
    timeout: 30 * 1000
  },
  webServer: {
    command: 'jlpm start --port 8899',
    url: 'http://localhost:8899/lab',
    timeout: 180 * 1000,
    reuseExistingServer: !process.env.CI
  }
};
