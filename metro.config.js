const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [path.resolve(__dirname, 'src')],
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    // Resolves 'react-native-bracket-view' to local src/ during development
    extraNodeModules: {
      '@gaganalakruwan/react-native-tournament-bracket': path.resolve(__dirname, 'src'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
