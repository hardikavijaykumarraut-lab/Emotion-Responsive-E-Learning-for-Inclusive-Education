const { override } = require('customize-cra');

module.exports = override(
  function(config, env) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      crypto: false,
      stream: false,
      path: false
    };
    return config;
  }
);