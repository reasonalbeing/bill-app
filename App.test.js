import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from './App';
import AppNavigator from './src/navigation/AppNavigator';

// Mock AppNavigator
jest.mock('./src/navigation/AppNavigator', () => {
  const { View } = require('react-native');
  return jest.fn(() => <View data-testid="app-navigator" />);
});

describe('App', () => {
  beforeEach(() => {
    // 清除所有模拟的调用
    AppNavigator.mockClear();
  });

  test('renders AppNavigator correctly', () => {
    render(<App />);
    
    // 验证AppNavigator被调用
    expect(AppNavigator).toHaveBeenCalledTimes(1);
  });

  test('renders without crashing', () => {
    const { root } = render(<App />);
    expect(root).toBeTruthy();
  });

  test('passes no props to AppNavigator', () => {
    render(<App />);
    expect(AppNavigator).toHaveBeenCalledWith({}, expect.anything());
  });
});
