module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // 忽略 React Native 相关的模块，专注于纯逻辑测试
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/react-native',
    '<rootDir>/node_modules/@react-native',
    '<rootDir>/node_modules/expo',
    '<rootDir>/node_modules/@expo',
  ],
  // 转换我们项目的源文件
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@react-navigation|react-native-safe-area-context|react-native-screens)/)',
  ],
  // 设置文件
  setupFilesAfterEnv: [],
};
