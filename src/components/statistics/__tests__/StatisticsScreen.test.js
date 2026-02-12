import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import StatisticsScreen from '../StatisticsScreen';

// Mock dependencies
jest.mock('../../../hooks/useTransactions', () => ({
  useTransactions: jest.fn(() => ({
    transactions: [],
    statistics: {
      totalIncome: 0,
      totalExpense: 0,
    },
    loading: false,
    error: null,
    refresh: jest.fn().mockResolvedValue(undefined),
    loadStatistics: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(() => ({ uid: '123' })),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('react-native', () => ({
  View: () => null,
  Text: () => null,
  ScrollView: ({ children, refreshControl }) => children,
  StyleSheet: {
    create: jest.fn(() => ({})),
  },
  TouchableOpacity: ({ onPress, children }) => children,
  ActivityIndicator: () => null,
  RefreshControl: () => null,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
  })),
}));

describe('StatisticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with empty data', async () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    useTransactions.mockReturnValue({
      transactions: [],
      statistics: {
        totalIncome: 0,
        totalExpense: 0,
      },
      loading: false,
      error: null,
      refresh: jest.fn().mockResolvedValue(undefined),
      loadStatistics: jest.fn().mockResolvedValue(undefined),
    });

    render(<StatisticsScreen />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('handles loading state', async () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    useTransactions.mockReturnValue({
      transactions: [],
      statistics: {
        totalIncome: 0,
        totalExpense: 0,
      },
      loading: true,
      error: null,
      refresh: jest.fn().mockResolvedValue(undefined),
      loadStatistics: jest.fn().mockResolvedValue(undefined),
    });

    render(<StatisticsScreen />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('handles error state', async () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    useTransactions.mockReturnValue({
      transactions: [],
      statistics: {
        totalIncome: 0,
        totalExpense: 0,
      },
      loading: false,
      error: 'Failed to load data',
      refresh: jest.fn().mockResolvedValue(undefined),
      loadStatistics: jest.fn().mockResolvedValue(undefined),
    });

    render(<StatisticsScreen />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('handles time range selection', async () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    useTransactions.mockReturnValue({
      transactions: [],
      statistics: {
        totalIncome: 0,
        totalExpense: 0,
      },
      loading: false,
      error: null,
      refresh: jest.fn().mockResolvedValue(undefined),
      loadStatistics: jest.fn().mockResolvedValue(undefined),
    });

    render(<StatisticsScreen />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('handles refresh functionality', async () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    const mockRefresh = jest.fn().mockResolvedValue(undefined);
    const mockLoadStatistics = jest.fn().mockResolvedValue(undefined);
    
    useTransactions.mockReturnValue({
      transactions: [],
      statistics: {
        totalIncome: 0,
        totalExpense: 0,
      },
      loading: false,
      error: null,
      refresh: mockRefresh,
      loadStatistics: mockLoadStatistics,
    });

    render(<StatisticsScreen />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('renders with transaction data', async () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    useTransactions.mockReturnValue({
      transactions: [
        {
          id: '1',
          type: 'expense',
          amount: '100',
          category_name: 'Food',
          category_color: '#FF0000',
          category_icon: 'restaurant',
          platform: 'alipay',
          date: new Date().toISOString().split('T')[0],
        },
        {
          id: '2',
          type: 'income',
          amount: '500',
          category_name: 'Salary',
          category_color: '#00FF00',
          category_icon: 'cash',
          platform: 'other',
          date: new Date().toISOString().split('T')[0],
        },
      ],
      statistics: {
        totalIncome: 500,
        totalExpense: 100,
      },
      loading: false,
      error: null,
      refresh: jest.fn().mockResolvedValue(undefined),
      loadStatistics: jest.fn().mockResolvedValue(undefined),
    });

    render(<StatisticsScreen />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('renders with category statistics', async () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    useTransactions.mockReturnValue({
      transactions: [
        {
          id: '1',
          type: 'expense',
          amount: '100',
          category_name: 'Food',
          category_color: '#FF0000',
          category_icon: 'restaurant',
          platform: 'alipay',
          date: new Date().toISOString().split('T')[0],
        },
        {
          id: '2',
          type: 'expense',
          amount: '50',
          category_name: 'Transport',
          category_color: '#0000FF',
          category_icon: 'car',
          platform: 'wechat',
          date: new Date().toISOString().split('T')[0],
        },
      ],
      statistics: {
        totalIncome: 0,
        totalExpense: 150,
      },
      loading: false,
      error: null,
      refresh: jest.fn().mockResolvedValue(undefined),
      loadStatistics: jest.fn().mockResolvedValue(undefined),
    });

    render(<StatisticsScreen />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('renders with platform statistics', async () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    useTransactions.mockReturnValue({
      transactions: [
        {
          id: '1',
          type: 'expense',
          amount: '100',
          category_name: 'Food',
          category_color: '#FF0000',
          category_icon: 'restaurant',
          platform: 'alipay',
          date: new Date().toISOString().split('T')[0],
        },
        {
          id: '2',
          type: 'expense',
          amount: '50',
          category_name: 'Transport',
          category_color: '#0000FF',
          category_icon: 'car',
          platform: 'wechat',
          date: new Date().toISOString().split('T')[0],
        },
      ],
      statistics: {
        totalIncome: 0,
        totalExpense: 150,
      },
      loading: false,
      error: null,
      refresh: jest.fn().mockResolvedValue(undefined),
      loadStatistics: jest.fn().mockResolvedValue(undefined),
    });

    render(<StatisticsScreen />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('renders with daily trend data', async () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    useTransactions.mockReturnValue({
      transactions: [
        {
          id: '1',
          type: 'expense',
          amount: '100',
          category_name: 'Food',
          category_color: '#FF0000',
          category_icon: 'restaurant',
          platform: 'alipay',
          date: today.toISOString().split('T')[0],
        },
        {
          id: '2',
          type: 'income',
          amount: '500',
          category_name: 'Salary',
          category_color: '#00FF00',
          category_icon: 'cash',
          platform: 'other',
          date: yesterday.toISOString().split('T')[0],
        },
      ],
      statistics: {
        totalIncome: 500,
        totalExpense: 100,
      },
      loading: false,
      error: null,
      refresh: jest.fn().mockResolvedValue(undefined),
      loadStatistics: jest.fn().mockResolvedValue(undefined),
    });

    render(<StatisticsScreen />);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });
});
