// Test ResetPasswordScreen component functionality

// Import React first
import React from 'react';

// Mock react-native modules
jest.mock('react-native', () => {
  const React = require('react');
  const mockAlert = jest.fn();
  return {
    Platform: {
      OS: 'ios',
      Version: 14,
      select: jest.fn(obj => obj.ios || obj.default),
    },
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 812,
      })),
    },
    StyleSheet: {
      create: jest.fn(obj => obj),
      flatten: jest.fn(style => style),
    },
    Text: ({ children, ...props }) => React.createElement('Text', props, children),
    View: ({ children, ...props }) => React.createElement('View', props, children),
    TouchableOpacity: ({ children, ...props }) => React.createElement('TouchableOpacity', props, children),
    TextInput: ({ children, ...props }) => React.createElement('TextInput', props, children),
    Alert: {
      alert: mockAlert,
    },
    KeyboardAvoidingView: ({ children, ...props }) => React.createElement('KeyboardAvoidingView', props, children),
  };
});

// Get mockAlert from the mock
const { Alert } = require('react-native');
const mockAlert = Alert.alert;

// Mock dependencies
jest.mock('../../../services/authService', () => ({
  resetPassword: jest.fn(),
}));

// Import other dependencies
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ResetPasswordScreen from '../ResetPasswordScreen';
import { resetPassword } from '../../../services/authService';

const mockNavigation = {
  navigate: jest.fn(),
};

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(<ResetPasswordScreen navigation={mockNavigation} />);
    
    expect(getByPlaceholderText('请输入邮箱')).toBeTruthy();
    expect(getByText('返回登录')).toBeTruthy();
  });

  it('should handle email input', () => {
    const { getByPlaceholderText } = render(<ResetPasswordScreen navigation={mockNavigation} />);
    
    const emailInput = getByPlaceholderText('请输入邮箱');
    fireEvent.changeText(emailInput, 'test@example.com');
    
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should navigate back to Login screen when back link is pressed', () => {
    const { getByText } = render(<ResetPasswordScreen navigation={mockNavigation} />);
    
    const backLink = getByText('返回登录');
    fireEvent.press(backLink);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('should call resetPassword and show success message on successful reset', async () => {
    // Mock successful password reset
    resetPassword.mockResolvedValue();
    
    const { getByText, getByPlaceholderText, getAllByText } = render(<ResetPasswordScreen navigation={mockNavigation} />);
    
    // Enter email
    const emailInput = getByPlaceholderText('请输入邮箱');
    const resetButtons = getAllByText('发送重置链接');
    const resetButton = resetButtons[resetButtons.length - 1]; // Get the last one (reset button)
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(resetButton);
    
    // Wait for reset to complete
    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('test@example.com');
    });
    
    // Verify success alert was called
    expect(mockAlert).toHaveBeenCalledWith('邮件已发送', '请检查您的邮箱以重置密码');
  });

  it('should show error on password reset failure', async () => {
    // Mock failed password reset
    const errorMessage = 'Failed to send reset link';
    resetPassword.mockRejectedValue(new Error(errorMessage));
    
    const { getByText, getByPlaceholderText, getAllByText } = render(<ResetPasswordScreen navigation={mockNavigation} />);
    
    // Enter email
    const emailInput = getByPlaceholderText('请输入邮箱');
    const resetButtons = getAllByText('发送重置链接');
    const resetButton = resetButtons[resetButtons.length - 1]; // Get the last one (reset button)
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(resetButton);
    
    // Wait for error
    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('test@example.com');
    });
    
    // Verify error alert was called
    expect(mockAlert).toHaveBeenCalledWith('发送失败', errorMessage);
  });

  it('should show alert when email is empty', () => {
    const { getByText, getAllByText } = render(<ResetPasswordScreen navigation={mockNavigation} />);
    
    const resetButtons = getAllByText('发送重置链接');
    const resetButton = resetButtons[resetButtons.length - 1]; // Get the last one (reset button)
    fireEvent.press(resetButton);
    
    // Verify alert was called
    expect(mockAlert).toHaveBeenCalledWith('提示', '请输入邮箱');
  });

  it('should show loading state during password reset', async () => {
    // Mock reset with delay
    const mockReset = new Promise(resolve => setTimeout(resolve, 100));
    resetPassword.mockReturnValue(mockReset);
    
    const { getByText, getByPlaceholderText, getAllByText } = render(<ResetPasswordScreen navigation={mockNavigation} />);
    
    // Enter email
    const emailInput = getByPlaceholderText('请输入邮箱');
    const resetButtons = getAllByText('发送重置链接');
    const resetButton = resetButtons[resetButtons.length - 1]; // Get the last one (reset button)
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(resetButton);
    
    // Verify loading state
    expect(getByText('发送中...')).toBeTruthy();
    
    // Wait for reset to complete
    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });
});
