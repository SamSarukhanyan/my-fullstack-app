const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to use the compiled CommonJS build of react-native-gesture-handler
// instead of the TypeScript source (src/index.ts), which can fail to resolve './State'.
const gestureHandlerPath = path.resolve(
  __dirname,
  'node_modules/react-native-gesture-handler/lib/commonjs/index.js'
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-gesture-handler') {
    return { type: 'sourceFile', filePath: gestureHandlerPath };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
