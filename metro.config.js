const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// lucide-react-native ships .mjs files; Metro needs this extension registered
config.resolver.sourceExts.push('mjs');

// expo-sqlite on web runs on a wasm build of SQLite that needs SharedArrayBuffer,
// which browsers only expose on cross-origin-isolated pages.
config.resolver.assetExts.push('wasm');
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;
