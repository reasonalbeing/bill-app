import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import AddTransactionScreen from '../AddTransactionScreen';
import { useTransactions } from '../../../hooks/useTransactions';
import { useCategories } from '../../../hooks/useCategories';
import { getCurrentUser } from '../../../services/authService';

// Mock React Native components
jest.mock('react-native', () => {
  const React = require('react');
  const mockAlert = jest.fn();
  return {
    View: ({ children, ...props }) => React.createElement('View', props, children),
    Text: ({ children, ...props }) => React.createElement('Text', props, children),
    TextInput: ({ value, onChangeText, ...props }) => React.createElement('TextInput', { ...props, value, onChangeText }),
    TouchableOpacity: ({ onPress, children, ...props }) => React.createElement('TouchableOpacity', { ...props, onPress }, children),
    StyleSheet: {
      create: jest.fn(obj => obj),
      flatten: jest.fn(style => style),
    },
    Alert: {
      alert: mockAlert,
    },
    ScrollView: ({ children, ...props }) => React.createElement('ScrollView', props, children),
    KeyboardAvoidingView: ({ children, ...props }) => React.createElement('KeyboardAvoidingView', props, children),
    Platform: {
      OS: 'ios',
    },
    Modal: ({ visible, children, ...props }) => visible && React.createElement('Modal', props, children),
    ActivityIndicator: ({ ...props }) => React.createElement('ActivityIndicator', props),
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name, ...props }) => React.createElement('Ionicons', { ...props, testID: `icon-${name}` }),
  };
});

// Mock custom hooks
jest.mock('../../../hooks/useTransactions', () => ({
  useTransactions: jest.fn(() => ({
    createTransaction: jest.fn(),
    loading: false,
  })),
}));

jest.mock('../../../hooks/useCategories', () => ({
  useCategories: jest.fn(() => ({
    expenseCategories: [
      { id: 1, name: '餐饮', color: '#FF6B6B', icon: 'restaurant' },
      { id: 2, name: '交通', color: '#4ECDC4', icon: 'car' },
    ],
    incomeCategories: [
      { id: 3, name: '工资', color: '#45B7D1', icon: 'cash' },
      { id: 4, name: '奖金', color: '#96CEB4', icon: 'trophy' },
    ],
    loading: false,
    initializeDefaultCategories: jest.fn(),
  })),
}));

// Mock auth service
jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(() => ({ uid: 'test-user-id' })),
}));

describe('AddTransactionScreen', () => {
  let mockNavigation;
  let mockCreateTransaction;
  let mockInitializeDefaultCategories;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock navigation
    mockNavigation = {
      navigate: jest.fn(),
    };

    // Setup mock functions
    mockCreateTransaction = jest.fn();
    mockInitializeDefaultCategories = jest.fn();

    // Mock hooks
    useTransactions.mockReturnValue({
      createTransaction: mockCreateTransaction,
      loading: false,
    });

    useCategories.mockReturnValue({
      expenseCategories: [
        { id: 1, name: '餐饮', color: '#FF6B6B', icon: 'restaurant' },
        { id: 2, name: '交通', color: '#4ECDC4', icon: 'car' },
      ],
      incomeCategories: [
        { id: 3, name: '工资', color: '#45B7D1', icon: 'cash' },
        { id: 4, name: '奖金', color: '#96CEB4', icon: 'trophy' },
      ],
      loading: false,
      initializeDefaultCategories: mockInitializeDefaultCategories,
    });

    // Mock current user
    getCurrentUser.mockReturnValue({ uid: 'test-user-id' });
  });

  test('should render correctly', () => {
    const { getByText } = render(<AddTransactionScreen navigation={mockNavigation} />);

    expect(getByText('支出')).toBeDefined();
    expect(getByText('收入')).toBeDefined();
    expect(getByText('分类')).toBeDefined();
    expect(getByText('日期')).toBeDefined();
    expect(getByText('支付平台')).toBeDefined();
    expect(getByText('支付方式（选填）')).toBeDefined();
    expect(getByText('备注（选填）')).toBeDefined();
    expect(getByText('保存')).toBeDefined();
  });

  test('should switch between expense and income types', () => {
    const { getByText } = render(<AddTransactionScreen navigation={mockNavigation} />);

    // Check initial state (expense)
    expect(getByText('支出')).toBeDefined();

    // Switch to income
    fireEvent.press(getByText('收入'));

    // Verify the switch was triggered
    expect(getByText('收入')).toBeDefined();
  });

  test('should show error when saving without amount', async () => {
    const { getByText } = render(<AddTransactionScreen navigation={mockNavigation} />);

    // Click save without entering amount
    fireEvent.press(getByText('保存'));

    // Wait for alert to be called
    await waitFor(() => {
      expect(require('react-native').Alert.alert).toHaveBeenCalledWith('提示', '请输入有效的金额');
    });
  });

  test('should show error when saving without category', async () => {
    const { getByText, getAllByDisplayValue } = render(<AddTransactionScreen navigation={mockNavigation} />);

    // Enter amount - use first input with empty value
    const inputs = getAllByDisplayValue('');
    const amountInput = inputs[0]; // Assuming first input is amount
    fireEvent.changeText(amountInput, '100');

    // Click save without selecting category
    fireEvent.press(getByText('保存'));

    // Wait for alert to be called
    await waitFor(() => {
      expect(require('react-native').Alert.alert).toHaveBeenCalledWith('提示', '请选择分类');
    });
  });

  test('should save transaction successfully', async () => {
    const { getByText, getAllByDisplayValue } = render(<AddTransactionScreen navigation={mockNavigation} />);

    // Mock successful save
    mockCreateTransaction.mockResolvedValue({ success: true });

    // Enter amount - use first input with empty value
    const inputs = getAllByDisplayValue('');
    const amountInput = inputs[0]; // Assuming first input is amount
    fireEvent.changeText(amountInput, '100');

    // Open category modal
    fireEvent.press(getByText('分类'));

    // Select category
    const categoryItem = screen.getByText('餐饮');
    fireEvent.press(categoryItem);

    // Click save
    fireEvent.press(getByText('保存'));

    // Wait for save to complete
    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith({
        amount: 100,
        type: 'expense',
        category_id: 1,
        description: '',
        date: expect.any(String),
        payment_method: '',
        platform: 'other',
      });
    });

    // Wait for success alert
    await waitFor(() => {
      expect(require('react-native').Alert.alert).toHaveBeenCalledWith('成功', '记账已保存', expect.any(Array));
    });
  });

  test('should handle save failure', async () => {
    const { getByText, getAllByDisplayValue } = render(<AddTransactionScreen navigation={mockNavigation} />);

    // Mock failed save
    mockCreateTransaction.mockResolvedValue({ success: false, error: '保存失败' });

    // Enter amount - use first input with empty value
    const inputs = getAllByDisplayValue('');
    const amountInput = inputs[0]; // Assuming first input is amount
    fireEvent.changeText(amountInput, '100');

    // Open category modal
    fireEvent.press(getByText('分类'));

    // Select category
    const categoryItem = screen.getByText('餐饮');
    fireEvent.press(categoryItem);

    // Click save
    fireEvent.press(getByText('保存'));

    // Wait for save to complete
    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalled();
    });

    // Wait for error alert
    await waitFor(() => {
      expect(require('react-native').Alert.alert).toHaveBeenCalledWith('保存失败', '保存失败');
    });
  });

  test('should open and close category modal', () => {
    const { getByText } = render(<AddTransactionScreen navigation={mockNavigation} />);

    // Open category modal
    fireEvent.press(getByText('分类'));

    // Verify modal is open (category items should be visible)
    expect(getByText('餐饮')).toBeDefined();
    expect(getByText('交通')).toBeDefined();

    // Close modal
    const closeButton = screen.getByTestId('icon-close');
    fireEvent.press(closeButton);
  });

  test('should open and close date modal', () => {
    const { getByText } = render(<AddTransactionScreen navigation={mockNavigation} />);

    // Open date modal
    fireEvent.press(getByText('日期'));

    // Verify modal is open (date picker should be visible)
    expect(getByText('选择日期')).toBeDefined();

    // Close modal
    const closeButton = screen.getByTestId('icon-close');
    fireEvent.press(closeButton);
  });

  test('should select payment platform', () => {
    const { getByText } = render(<AddTransactionScreen navigation={mockNavigation} />);

    // Select Alipay
    fireEvent.press(getByText('支付宝'));

    // Select WeChat
    fireEvent.press(getByText('微信'));

    // Select Other
    fireEvent.press(getByText('其他'));
  });

  test('should initialize default categories on mount', async () => {
    render(<AddTransactionScreen navigation={mockNavigation} />);

    // Wait for initialization
    await waitFor(() => {
      expect(mockInitializeDefaultCategories).toHaveBeenCalled();
    });
  });
});
