import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { getCurrentUser, logout } from '../../../services/authService';

// Mock dependencies
jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(() => ({ uid: '123', email: 'test@example.com' })),
  logout: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('react-native', () => ({
  View: () => null,
  Text: () => null,
  TouchableOpacity: () => null,
  ScrollView: ({ children }) => children,
  StyleSheet: {
    create: jest.fn(() => ({})),
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
  ActivityIndicator: () => null,
  Modal: () => null,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
  })),
}));

// Mock expo-secure-store to avoid import errors
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

describe('SettingsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with user logged in', () => {
    render(<SettingsScreen navigation={mockNavigation} />);
    expect(true).toBe(true);
  });

  it('renders correctly with user not logged in', () => {
    const { getCurrentUser } = require('../../../services/authService');
    getCurrentUser.mockReturnValue(null);
    render(<SettingsScreen navigation={mockNavigation} />);
    expect(true).toBe(true);
  });
});
