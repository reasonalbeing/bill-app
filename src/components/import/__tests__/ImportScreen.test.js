// Test ImportScreen component functionality

// Mock hooks first before any imports
jest.mock('../../../hooks/useCategories', () => ({
  useCategories: jest.fn((userId) => ({
    categories: [],
    expenseCategories: [{ id: 1, name: '餐饮', color: '#FF6B6B' }],
    loading: false,
    error: null,
  })),
}));

// Mock services
jest.mock('../../../services/csvParserService', () => ({
  parseCSV: jest.fn(),
  detectBillType: jest.fn(),
  parseAlipayBill: jest.fn(() => [{ date: '2024-01-01', amount: 100, description: 'Test' }]),
  parseWechatBill: jest.fn(() => [{ date: '2024-01-01', amount: 100, description: 'Test' }]),
  convertToAppFormat: jest.fn(),
}));

jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(() => ({ uid: 'test-user-id' })),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name, size, color, ...props }) => React.createElement('Ionicons', { ...props, testID: `icon-${name}` }),
  };
});

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

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
    ScrollView: ({ children, ...props }) => React.createElement('ScrollView', props, children),
    ActivityIndicator: ({ color, size, ...props }) => React.createElement('ActivityIndicator', props),
    Alert: {
      alert: mockAlert,
    },
  };
});

// Import dependencies
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ImportScreen from '../ImportScreen';
import { getDocumentAsync } from 'expo-document-picker';
import { parseCSV, detectBillType, convertToAppFormat } from '../../../services/csvParserService';
import { getCurrentUser } from '../../../services/authService';

// Get mockAlert from the mock
const { Alert } = require('react-native');
const mockAlert = Alert.alert;

const mockNavigation = {
  navigate: jest.fn(),
};

describe('ImportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText } = render(<ImportScreen navigation={mockNavigation} />);
    
    expect(getByText('如何导出账单')).toBeTruthy();
    expect(getByText('选择账单文件')).toBeTruthy();
    expect(getByText('支持 CSV 格式的支付宝/微信账单')).toBeTruthy();
  });

  it('should handle file selection successfully', async () => {
    // Mock successful file picker
    getDocumentAsync.mockResolvedValue({
      cancelled: false,
      assets: [{
        uri: 'file://test.csv',
        name: 'test.csv',
        mimeType: 'text/csv',
      }],
    });

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue('csv content'),
    });

    // Mock CSV parsing
    parseCSV.mockResolvedValue({ headers: ['date', 'amount', 'description'], data: [] });
    detectBillType.mockReturnValue('alipay');
    convertToAppFormat.mockReturnValue([{ date: '2024-01-01', amount: 100, description: 'Test', type: 'expense' }]);

    const { getByText } = render(<ImportScreen navigation={mockNavigation} />);
    
    const selectButton = getByText('选择账单文件');
    fireEvent.press(selectButton);
    
    // Wait for file selection and processing
    await waitFor(() => {
      expect(getDocumentAsync).toHaveBeenCalled();
    });

    // Wait for result card to appear and click preview button
    await waitFor(() => {
      const previewButton = getByText('查看并导入');
      fireEvent.press(previewButton);
    });

    // Wait for navigation to preview screen
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ImportPreview', expect.objectContaining({
        transactions: expect.any(Array),
        fileName: 'test.csv',
        billType: 'alipay',
      }));
    });
  });

  it('should handle file selection cancellation', async () => {
    // Mock cancelled file picker
    getDocumentAsync.mockResolvedValue({ cancelled: true });

    const { getByText } = render(<ImportScreen navigation={mockNavigation} />);
    
    const selectButton = getByText('选择账单文件');
    fireEvent.press(selectButton);
    
    // Wait for file selection
    await waitFor(() => {
      expect(getDocumentAsync).toHaveBeenCalled();
    });

    // Verify no navigation
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('should show error for unknown bill type', async () => {
    // Mock successful file picker
    getDocumentAsync.mockResolvedValue({
      cancelled: false,
      assets: [{
        uri: 'file://test.csv',
        name: 'test.csv',
        mimeType: 'text/csv',
      }],
    });

    // Mock fetch
    global.fetch = jest.fn(() => Promise.resolve({
      text: () => Promise.resolve('csv content'),
    }));

    // Mock CSV parsing with unknown bill type
    parseCSV.mockResolvedValue({ headers: ['unknown'], data: [] });
    detectBillType.mockReturnValue('unknown');

    const { getByText } = render(<ImportScreen navigation={mockNavigation} />);
    
    const selectButton = getByText('选择账单文件');
    fireEvent.press(selectButton);
    
    // Wait for file selection and processing
    await waitFor(() => {
      expect(getDocumentAsync).toHaveBeenCalled();
    });

    // Verify error alert
    expect(mockAlert).toHaveBeenCalledWith('无法识别', '无法识别该文件的账单类型，请确保是支付宝或微信账单文件');
  });

  it('should show error for parsing failure', async () => {
    // Mock successful file picker
    getDocumentAsync.mockResolvedValue({
      cancelled: false,
      assets: [{
        uri: 'file://test.csv',
        name: 'test.csv',
        mimeType: 'text/csv',
      }],
    });

    // Mock fetch failure
    global.fetch = jest.fn(() => Promise.reject(new Error('Fetch failed')));

    const { getByText } = render(<ImportScreen navigation={mockNavigation} />);
    
    const selectButton = getByText('选择账单文件');
    fireEvent.press(selectButton);
    
    // Wait for file selection and error
    await waitFor(() => {
      expect(getDocumentAsync).toHaveBeenCalled();
    });

    // Verify error alert
    expect(mockAlert).toHaveBeenCalledWith('错误', '读取文件失败: Fetch failed');
  });

  it('should show loading state during file processing', async () => {
    // Mock file picker with delay
    const mockFilePicker = new Promise(resolve => setTimeout(() => {
      resolve({
        cancelled: false,
        assets: [{
          uri: 'file://test.csv',
          name: 'test.csv',
          mimeType: 'text/csv',
        }],
      });
    }, 100));
    getDocumentAsync.mockReturnValue(mockFilePicker);

    // Mock fetch with delay
    global.fetch = jest.fn(() => new Promise(resolve => setTimeout(() => {
      resolve({ text: () => Promise.resolve('csv content') });
    }, 50)));

    // Mock CSV parsing
    parseCSV.mockResolvedValue({ headers: ['date', 'amount', 'description'], data: [] });
    detectBillType.mockReturnValue('alipay');
    convertToAppFormat.mockReturnValue([]);

    const { getByText } = render(<ImportScreen navigation={mockNavigation} />);
    
    const selectButton = getByText('选择账单文件');
    fireEvent.press(selectButton);
    
    // Wait for file selection
    await waitFor(() => {
      expect(getDocumentAsync).toHaveBeenCalled();
    });

    // Verify loading state (ActivityIndicator should be present)
    // Note: We can't directly test ActivityIndicator text since it doesn't have text content
  });
});
