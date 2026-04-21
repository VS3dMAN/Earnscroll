module.exports = function (api) {
  api.cache(true);

  const plugins = [
    'react-native-worklets-core/plugin',
    'react-native-worklets/plugin', // <--- This must be LAST of the worklet plugins
  ];

  // Strip console.log/warn/error in production to prevent info leakage via logcat
  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};