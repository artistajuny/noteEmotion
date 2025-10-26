// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // (Expo Router 쓰면 유지)
      'expo-router/babel',
      // 마지막에 worklets 플러그인 (reanimated/plugin 대신)
      ['react-native-worklets/plugin', { reanimatedAlias: 'react-native-reanimated' }],
    ],
  };
};
