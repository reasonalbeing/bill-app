import React from 'react';
import { render } from '@testing-library/react-native';

// Mock the entire navigation module
export const mockNavigationContainer = jest.fn(({ children }) => children);
export const mockStackNavigator = jest.fn(({ children }) => children);
export const mockStackScreen = jest.fn(({ name, component, options }) => null);

// Mock React Navigation modules
global.React = React;
global.ReactNavigation = {
  NavigationContainer: mockNavigationContainer,
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: mockStackNavigator,
    Screen: mockStackScreen
  }))
};

// Mock all screen components
global.mockLoginScreen = jest.fn(() => null);
global.mockRegisterScreen = jest.fn(() => null);
global.mockResetPasswordScreen = jest.fn(() => null);
global.mockMainTabNavigator = jest.fn(() => null);
global.mockImportScreen = jest.fn(() => null);
global.mockImportPreviewScreen = jest.fn(() => null);
global.mockAIConfigScreen = jest.fn(() => null);
global.mockAIChatScreen = jest.fn(() => null);
global.mockBackupScreen = jest.fn(() => null);
global.mockTransactionDetailScreen = jest.fn(() => null);
global.mockStatisticsRulesScreen = jest.fn(() => null);
global.mockOCRScreen = jest.fn(() => null);

// Mock the module imports
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: global.ReactNavigation.NavigationContainer
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: global.ReactNavigation.createNativeStackNavigator
}));

jest.mock('../MainTabNavigator', () => global.mockMainTabNavigator);
jest.mock('../../components/auth/LoginScreen', () => global.mockLoginScreen);
jest.mock('../../components/auth/RegisterScreen', () => global.mockRegisterScreen);
jest.mock('../../components/auth/ResetPasswordScreen', () => global.mockResetPasswordScreen);
jest.mock('../../components/import/ImportScreen', () => global.mockImportScreen);
jest.mock('../../components/import/ImportPreviewScreen', () => global.mockImportPreviewScreen);
jest.mock('../../components/settings/AIConfigScreen', () => global.mockAIConfigScreen);
jest.mock('../../components/ai/AIChatScreen', () => global.mockAIChatScreen);
jest.mock('../../components/settings/BackupScreen', () => global.mockBackupScreen);
jest.mock('../../components/transactions/TransactionDetailScreen', () => global.mockTransactionDetailScreen);
jest.mock('../../components/settings/StatisticsRulesScreen', () => global.mockStatisticsRulesScreen);
jest.mock('../../components/ocr/OCRScreen', () => global.mockOCRScreen);

// Now import the AppNavigator after mocks are set up
let AppNavigator;
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Re-import AppNavigator for each test
  delete require.cache[require.resolve('../AppNavigator')];
  AppNavigator = require('../AppNavigator').default;
});

describe('AppNavigator', () => {
  test('should be defined', () => {
    expect(AppNavigator).toBeDefined();
    expect(typeof AppNavigator).toBe('function');
  });

  test('should render without crashing', () => {
    expect(() => {
      render(<AppNavigator />);
    }).not.toThrow();
  });

  test('should use NavigationContainer', () => {
    render(<AppNavigator />);
    expect(mockNavigationContainer).toHaveBeenCalled();
  });

  test('should use StackNavigator', () => {
    render(<AppNavigator />);
    expect(mockStackNavigator).toHaveBeenCalled();
  });

  test('should define all required screens', () => {
    render(<AppNavigator />);
    
    // Check that Screen was called with all required screen names
    const screenCalls = mockStackScreen.mock.calls;
    const screenNames = screenCalls.map(call => call[0].name);
    
    expect(screenNames).toContain('Login');
    expect(screenNames).toContain('Register');
    expect(screenNames).toContain('ResetPassword');
    expect(screenNames).toContain('Main');
    expect(screenNames).toContain('Import');
    expect(screenNames).toContain('ImportPreview');
    expect(screenNames).toContain('AIConfig');
    expect(screenNames).toContain('AIChat');
    expect(screenNames).toContain('Backup');
    expect(screenNames).toContain('TransactionDetail');
    expect(screenNames).toContain('StatisticsRules');
    expect(screenNames).toContain('OCR');
  });
});
