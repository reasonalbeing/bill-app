// Test RegisterScreen component functionality

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
  registerUser: jest.fn(),
}));

// Import other dependencies
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';
import { registerUser } from '../../../services/authService';

const mockNavigation = {
  replace: jest.fn(),
  navigate: jest.fn(),
};

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    expect(getByPlaceholderText('请输入用户名')).toBeTruthy();
    expect(getByPlaceholderText('请输入邮箱')).toBeTruthy();
    expect(getByPlaceholderText('请输入密码')).toBeTruthy();
    expect(getByPlaceholderText('请再次输入密码')).toBeTruthy();
    expect(getByText('已有账号？')).toBeTruthy();
    expect(getByText('立即登录')).toBeTruthy();
  });

  it('should handle username input', () => {
    const { getByPlaceholderText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    const usernameInput = getByPlaceholderText('请输入用户名');
    fireEvent.changeText(usernameInput, 'testuser');
    
    expect(usernameInput.props.value).toBe('testuser');
  });

  it('should handle email input', () => {
    const { getByPlaceholderText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    const emailInput = getByPlaceholderText('请输入邮箱');
    fireEvent.changeText(emailInput, 'test@example.com');
    
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should handle password input', () => {
    const { getByPlaceholderText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    const passwordInput = getByPlaceholderText('请输入密码');
    fireEvent.changeText(passwordInput, 'password123');
    
    expect(passwordInput.props.value).toBe('password123');
  });

  it('should handle confirm password input', () => {
    const { getByPlaceholderText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    const confirmPasswordInput = getByPlaceholderText('请再次输入密码');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    
    expect(confirmPasswordInput.props.value).toBe('password123');
  });

  it('should navigate to Login screen when login link is pressed', () => {
    const { getByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    const loginLink = getByText('立即登录');
    fireEvent.press(loginLink);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('should call registerUser and navigate on successful registration', async () => {
    // Mock successful registration
    registerUser.mockResolvedValue();
    
    const { getByText, getByPlaceholderText, getAllByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    // Enter credentials
    const usernameInput = getByPlaceholderText('请输入用户名');
    const emailInput = getByPlaceholderText('请输入邮箱');
    const passwordInput = getByPlaceholderText('请输入密码');
    const confirmPasswordInput = getByPlaceholderText('请再次输入密码');
    const registerButtons = getAllByText('注册');
    const registerButton = registerButtons[registerButtons.length - 1]; // Get the last one (register button)
    
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(registerButton);
    
    // Wait for registration to complete
    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith('test@example.com', 'password123', 'testuser');
    });
    
    // Verify navigation
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('should show error on registration failure', async () => {
    // Mock failed registration
    const errorMessage = 'Registration failed';
    registerUser.mockRejectedValue(new Error(errorMessage));
    
    const { getByText, getByPlaceholderText, getAllByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    // Enter credentials
    const usernameInput = getByPlaceholderText('请输入用户名');
    const emailInput = getByPlaceholderText('请输入邮箱');
    const passwordInput = getByPlaceholderText('请输入密码');
    const confirmPasswordInput = getByPlaceholderText('请再次输入密码');
    const registerButtons = getAllByText('注册');
    const registerButton = registerButtons[registerButtons.length - 1]; // Get the last one (register button)
    
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(registerButton);
    
    // Wait for error
    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith('test@example.com', 'password123', 'testuser');
    });
    
    // Verify alert was called
    expect(mockAlert).toHaveBeenCalledWith('注册失败', errorMessage);
  });

  it('should show alert when fields are empty', () => {
    const { getByText, getAllByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    const registerButtons = getAllByText('注册');
    const registerButton = registerButtons[registerButtons.length - 1]; // Get the last one (register button)
    fireEvent.press(registerButton);
    
    // Verify alert was called
    expect(mockAlert).toHaveBeenCalledWith('提示', '请填写所有必填字段');
  });

  it('should show alert when passwords do not match', () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    // Enter credentials with mismatched passwords
    const usernameInput = getByPlaceholderText('请输入用户名');
    const emailInput = getByPlaceholderText('请输入邮箱');
    const passwordInput = getByPlaceholderText('请输入密码');
    const confirmPasswordInput = getByPlaceholderText('请再次输入密码');
    const registerButtons = getAllByText('注册');
    const registerButton = registerButtons[registerButtons.length - 1]; // Get the last one (register button)
    
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'differentpassword');
    fireEvent.press(registerButton);
    
    // Verify alert was called
    expect(mockAlert).toHaveBeenCalledWith('提示', '两次输入的密码不一致');
  });

  it('should show loading state during registration', async () => {
    // Mock registration with delay
    const mockRegister = new Promise(resolve => setTimeout(resolve, 100));
    registerUser.mockReturnValue(mockRegister);
    
    const { getByText, getByPlaceholderText, getAllByText } = render(<RegisterScreen navigation={mockNavigation} />);
    
    // Enter credentials
    const usernameInput = getByPlaceholderText('请输入用户名');
    const emailInput = getByPlaceholderText('请输入邮箱');
    const passwordInput = getByPlaceholderText('请输入密码');
    const confirmPasswordInput = getByPlaceholderText('请再次输入密码');
    const registerButtons = getAllByText('注册');
    const registerButton = registerButtons[registerButtons.length - 1]; // Get the last one (register button)
    
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(registerButton);
    
    // Verify loading state
    expect(getByText('注册中...')).toBeTruthy();
    
    // Wait for registration to complete
    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith('test@example.com', 'password123', 'testuser');
    });
  });
});
