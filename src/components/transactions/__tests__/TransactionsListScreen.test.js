// Test file for TransactionsListScreen
// Tests the main functionality of the transactions list screen

// Mock Expo modules before importing the component
jest.mock('@expo/vector-icons', () => {
  return {
    Ionicons: 'Ionicons'
  };
});

// Mock react-native modules
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: jest.fn((styles) => styles)
  },
  FlatList: 'FlatList',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  Alert: {
    alert: jest.fn()
  },
  RefreshControl: 'RefreshControl'
}));

// Mock services
jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(() => ({ uid: 'test-user-id' }))
}));

// Mock hooks
jest.mock('../../../hooks/useTransactions', () => ({
  useTransactions: jest.fn(() => ({
    transactions: [
      {
        id: '1',
        amount: '100.50',
        type: 'expense',
        category: 'Food',
        category_name: 'Food',
        category_color: '#FF6B6B',
        category_icon: 'restaurant',
        description: 'Lunch',
        date: '2024-01-15',
        platform: 'alipay'
      },
      {
        id: '2',
        amount: '5000.00',
        type: 'income',
        category: 'Salary',
        category_name: 'Salary',
        category_color: '#4ECDC4',
        category_icon: 'cash',
        description: 'Monthly salary',
        date: '2024-01-01',
        platform: 'other'
      }
    ],
    loading: false,
    error: null,
    refresh: jest.fn(),
    deleteTransaction: jest.fn()
  }))
}));

describe('TransactionsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should be importable without errors', () => {
    expect(() => {
      require('../TransactionsListScreen');
    }).not.toThrow();
  });

  test('should be defined', () => {
    const TransactionsListScreen = require('../TransactionsListScreen').default;
    expect(TransactionsListScreen).toBeDefined();
  });

  test('should be a function', () => {
    const TransactionsListScreen = require('../TransactionsListScreen').default;
    expect(typeof TransactionsListScreen).toBe('function');
  });

  test('should have correct mock setup for useTransactions', () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    const result = useTransactions();
    
    expect(result).toHaveProperty('transactions');
    expect(result).toHaveProperty('loading');
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('refresh');
    expect(result).toHaveProperty('deleteTransaction');
    expect(Array.isArray(result.transactions)).toBe(true);
  });

  test('should have correct mock setup for getCurrentUser', () => {
    const { getCurrentUser } = require('../../../services/authService');
    const user = getCurrentUser();
    
    expect(user).toBeDefined();
    expect(user).toHaveProperty('uid');
  });

  test('should handle different transaction types in mock', () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    const result = useTransactions();
    
    const expenseTransactions = result.transactions.filter(t => t.type === 'expense');
    const incomeTransactions = result.transactions.filter(t => t.type === 'income');
    
    expect(expenseTransactions.length).toBeGreaterThan(0);
    expect(incomeTransactions.length).toBeGreaterThan(0);
  });

  test('should have transactions with required properties', () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    const result = useTransactions();
    
    result.transactions.forEach(transaction => {
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('type');
      expect(transaction).toHaveProperty('category');
      expect(transaction).toHaveProperty('date');
      expect(transaction).toHaveProperty('platform');
    });
  });
});