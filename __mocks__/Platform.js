// Mock Platform module for React Native
module.exports = {
  OS: 'ios',
  Version: 14,
  select: jest.fn(obj => obj.ios || obj.default),
  isTV: jest.fn(() => false),
  isTesting: true,
  constants: {
    reactNativeVersion: {
      major: 0,
      minor: 76,
      patch: 6,
      prerelease: null,
    },
  },
};
