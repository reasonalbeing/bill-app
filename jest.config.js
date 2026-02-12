module.exports = {
  testEnvironment: 'jest-environment-node',
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../Utilities/Platform$': '<rootDir>/__mocks__/Platform.js',
    '^react-native/Libraries/Utilities/Platform$': '<rootDir>/__mocks__/Platform.js',
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@expo|expo|expo-modules-core|expo-sqlite|expo-file-system|expo-document-picker|expo-sharing|expo-camera|expo-image-picker|expo-image-manipulator|expo-notifications|expo-secure-store|@expo/metro-runtime|@expo/vector-icons|expo-font)/)',
  ],
  globals: {
    __DEV__: true,
  },
  setupFiles: [
    '<rootDir>/jest.setup.js',
  ],
};
