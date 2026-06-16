module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // TV apps use console.log for remote event debug in dev
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
