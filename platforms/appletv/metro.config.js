/**
 * Metro configuration for react-native-tvos.
 * Extends the default RN metro config; no special overrides needed for TV.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
