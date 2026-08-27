/**
 * Extra webpack rules merged into the labextension build by @jupyterlab/builder.
 *
 * The emoji dataset is emitted as a static asset instead of webpack's default
 * JSON handling, which would inline all 432 KB into the bundle. emoji-picker-element
 * fetches it from the emitted URL, so the picker works without CDN access.
 */
module.exports = {
  module: {
    rules: [
      {
        test: /emoji-picker-element-data[\\/].*[\\/]data\.json$/,
        type: 'asset/resource'
      }
    ]
  }
};
