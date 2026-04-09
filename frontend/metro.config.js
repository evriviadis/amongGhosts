const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Colyseus relies on the "browser" condition inside package.json exports to load 'fetch' instead of Node 'http'
if (config.resolver.unstable_conditionNames) {
  config.resolver.unstable_conditionNames.push('browser');
} else {
  config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];
}

module.exports = config;
