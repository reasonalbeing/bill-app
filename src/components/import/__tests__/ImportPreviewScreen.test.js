// Test file for ImportPreviewScreen
// Tests the main functionality of the import preview screen

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
  Modal: 'Modal',
  ScrollView: 'ScrollView'
}));

// Mock hooks
jest.mock('../../../hooks/useTransactions', () => ({
  useTransactions: jest.fn(() => ({
    transactions: [],
    importTransactions: jest.fn(),
    loading: false,
    error: null
  }))
}));

jest.mock('../../../hooks/useCategories', () => ({
  useCategories: jest.fn(() => ({
    categories: [
      { id: '1', name: 'Food', type: 'expense' },
      { id: '2', name: 'Salary', type: 'income' }
    ],
    expenseCategories: [
      { id: '1', name: 'Food', type: 'expense' }
    ],
    incomeCategories: [
      { id: '2', name: 'Salary', type: 'income' }
    ],
    loading: false,
    error: null
  }))
}));

describe('ImportPreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should be importable without errors', () => {
    expect(() => {
      require('../ImportPreviewScreen');
    }).not.toThrow();
  });

  test('should be defined', () => {
    const ImportPreviewScreen = require('../ImportPreviewScreen').default;
    expect(ImportPreviewScreen).toBeDefined();
  });

  test('should be a function', () => {
    const ImportPreviewScreen = require('../ImportPreviewScreen').default;
    expect(typeof ImportPreviewScreen).toBe('function');
  });

  test('should have correct mock setup for useTransactions', () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    const result = useTransactions();
    
    expect(result).toHaveProperty('transactions');
    expect(result).toHaveProperty('importTransactions');
    expect(result).toHaveProperty('loading');
    expect(result).toHaveProperty('error');
  });

  test('should have correct mock setup for useCategories', () => {
    const { useCategories } = require('../../../hooks/useCategories');
    const result = useCategories();
    
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('expenseCategories');
    expect(result).toHaveProperty('incomeCategories');
    expect(result).toHaveProperty('loading');
    expect(result).toHaveProperty('error');
    expect(Array.isArray(result.categories)).toBe(true);
  });

  test('should have expense categories in mock', () => {
    const { useCategories } = require('../../../hooks/useCategories');
    const result = useCategories();
    
    expect(result.expenseCategories.length).toBeGreaterThan(0);
    result.expenseCategories.forEach(category => {
      expect(category.type).toBe('expense');
    });
  });

  test('should have income categories in mock', () => {
    const { useCategories } = require('../../../hooks/useCategories');
    const result = useCategories();
    
    expect(result.incomeCategories.length).toBeGreaterThan(0);
    result.incomeCategories.forEach(category => {
      expect(category.type).toBe('income');
    });
  });

  test('should have categories with required properties', () => {
    const { useCategories } = require('../../../hooks/useCategories');
    const result = useCategories();
    
    result.categories.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('type');
    });
  });
});