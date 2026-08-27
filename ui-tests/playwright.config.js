/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

// Galata resolves its baseURL as use.baseURL -> TARGET_URL -> hardcoded
// localhost:8888, and its base config sets no use.baseURL - so the port has to
// be threaded through both ends here and in jupyter_server_test_config.py.
const PORT = process.env.JUPYTER_TEST_PORT || '8888';
const BASE_URL = `http://localhost:${PORT}`;

module.exports = {
  ...baseConfig,
  // Increase timeout for environments with many extensions
  timeout: 120 * 1000,
  expect: {
    timeout: 30 * 1000
  },
  use: {
    ...baseConfig.use,
    baseURL: BASE_URL
  },
  webServer: {
    command: 'jlpm start',
    url: `${BASE_URL}/lab`,
    timeout: 180 * 1000,
    reuseExistingServer: false
  }
};
