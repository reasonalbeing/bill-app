// Test LoginScreen component functionality

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
  loginUser: jest.fn(),
}));

// Import other dependencies
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { loginUser } from '../../../services/authService';

const mockNavigation = {
  replace: jest.fn(),
  navigate: jest.fn(),
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    
    expect(getByPlaceholderText('请输入邮箱')).toBeTruthy();
    expect(getByPlaceholderText('请输入密码')).toBeTruthy();
    expect(getByText('忘记密码？')).toBeTruthy();
    expect(getByText('还没有账号？')).toBeTruthy();
    expect(getByText('立即注册')).toBeTruthy();
  });

  it('should handle email input', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    
    const emailInput = getByPlaceholderText('请输入邮箱');
    fireEvent.changeText(emailInput, 'test@example.com');
    
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should handle password input', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    
    const passwordInput = getByPlaceholderText('请输入密码');
    fireEvent.changeText(passwordInput, 'password123');
    
    expect(passwordInput.props.value).toBe('password123');
  });

  it('should navigate to ResetPassword screen when forgot password is pressed', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    const forgotPasswordLink = getByText('忘记密码？');
    fireEvent.press(forgotPasswordLink);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ResetPassword');
  });

  it('should navigate to Register screen when register link is pressed', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    const registerLink = getByText('立即注册');
    fireEvent.press(registerLink);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('should call loginUser and navigate on successful login', async () => {
    // Mock successful login
    loginUser.mockResolvedValue();
    
    const { getByText, getByPlaceholderText, getAllByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    // Enter credentials
    const emailInput = getByPlaceholderText('请输入邮箱');
    const passwordInput = getByPlaceholderText('请输入密码');
    const loginButtons = getAllByText('登录');
    const loginButton = loginButtons[loginButtons.length - 1]; // Get the last one (login button)
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);
    
    // Wait for login to complete
    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    
    // Verify navigation
    expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
  });

  it('should show error on login failure', async () => {
    // Mock failed login
    const errorMessage = 'Invalid credentials';
    loginUser.mockRejectedValue(new Error(errorMessage));
    
    const { getByText, getByPlaceholderText, getAllByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    // Enter credentials
    const emailInput = getByPlaceholderText('请输入邮箱');
    const passwordInput = getByPlaceholderText('请输入密码');
    const loginButtons = getAllByText('登录');
    const loginButton = loginButtons[loginButtons.length - 1]; // Get the last one (login button)
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(loginButton);
    
    // Wait for error
    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });
    
    // Verify alert was called
    expect(mockAlert).toHaveBeenCalledWith('登录失败', errorMessage);
  });

  it('should show alert when email or password is empty', () => {
    const { getByText, getAllByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    const loginButtons = getAllByText('登录');
    const loginButton = loginButtons[loginButtons.length - 1]; // Get the last one (login button)
    fireEvent.press(loginButton);
    
    // Verify alert was called
    expect(mockAlert).toHaveBeenCalledWith('提示', '请输入邮箱和密码');
  });

  it('should show loading state during login', async () => {
    // Mock login with delay
    const mockLogin = new Promise(resolve => setTimeout(resolve, 100));
    loginUser.mockReturnValue(mockLogin);
    
    const { getByText, getByPlaceholderText, getAllByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    // Enter credentials
    const emailInput = getByPlaceholderText('请输入邮箱');
    const passwordInput = getByPlaceholderText('请输入密码');
    const loginButtons = getAllByText('登录');
    const loginButton = loginButtons[loginButtons.length - 1]; // Get the last one (login button)
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);
    
    // Verify loading state
    expect(getByText('登录中...')).toBeTruthy();
    
    // Wait for login to complete
    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
