const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// lucide-react-native ships .mjs files; Metro needs this extension registered
config.resolver.sourceExts.push('mjs');

module.exports = config;
