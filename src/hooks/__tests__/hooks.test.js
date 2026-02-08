import { renderHook, act } from '@testing-library/react-hooks';
import { useBudgets, useCategories, useDatabase, useTransactions } from '../index';
import Database from '../database/database';

// Mock dependencies
jest.mock('../database/database');

const mockDatabase = Database;

describe('hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useDatabase', () => {
    test('should initialize database successfully', async () => {
      mockDatabase.init.mockResolvedValue();
      mockDatabase.isInitialized = true;
      
      const { result, waitForNextUpdate } = renderHook(() => useDatabase());
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      
      await waitForNextUpdate();
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.error).toBe(null);
      expect(mockDatabase.init).toHaveBeenCalled();
    });

    test('should handle database initialization error', async () => {
      mockDatabase.init.mockRejectedValue(new Error('Database initialization error'));
      mockDatabase.isInitialized = false;
      
      const { result, waitForNextUpdate } = renderHook(() => useDatabase());
      
      expect(result.current.isLoading).toBe(true);
      
      await waitForNextUpdate();
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).toBe('Database initialization error');
    });

    test('should not reinitialize if already initialized', async () => {
      mockDatabase.isInitialized = true;
      
      const { result } = renderHook(() => useDatabase());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInitialized).toBe(true);
      expect(mockDatabase.init).not.toHaveBeenCalled();
    });
  });

  describe('useCategories', () => {
    test('should fetch categories successfully', async () => {
      const mockCategories = [
        { id: 1, name: '餐饮', type: 'expense' },
        { id: 2, name: '工资', type: 'income' },
      ];
      
      mockDatabase.executeSql.mockResolvedValue({
        rows: {
          length: 2,
          item: jest.fn((index) => mockCategories[index]),
        },
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useCategories());
      
      expect(result.current.categories).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      
      await waitForNextUpdate();
      
      expect(result.current.categories).toEqual(mockCategories);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        'SELECT * FROM categories WHERE user_id = ? OR is_default = 1 ORDER BY type, name',
        [expect.any(String)]
      );
    });

    test('should handle fetch categories error', async () => {
      mockDatabase.executeSql.mockRejectedValue(new Error('Fetch categories error'));
      
      const { result, waitForNextUpdate } = renderHook(() => useCategories());
      
      await waitForNextUpdate();
      
      expect(result.current.categories).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Fetch categories error');
    });

    test('should add category successfully', async () => {
      const initialCategories = [{ id: 1, name: '餐饮', type: 'expense' }];
      const newCategory = { name: '交通', type: 'expense' };
      
      // Mock initial fetch
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: {
            length: 1,
            item: jest.fn(() => initialCategories[0]),
          },
        })
        .mockResolvedValueOnce({ insertId: 2 });
      
      const { result, waitForNextUpdate } = renderHook(() => useCategories());
      
      await waitForNextUpdate();
      
      // Add category
      await act(async () => {
        await result.current.addCategory(newCategory);
      });
      
      await waitForNextUpdate();
      
      expect(result.current.categories).toHaveLength(2);
      expect(result.current.categories[1].id).toBe(2);
      expect(result.current.categories[1].name).toBe('交通');
    });

    test('should update category successfully', async () => {
      const initialCategories = [{ id: 1, name: '餐饮', type: 'expense' }];
      const updatedCategory = { id: 1, name: '美食', type: 'expense' };
      
      // Mock initial fetch
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: {
            length: 1,
            item: jest.fn(() => initialCategories[0]),
          },
        });
      
      const { result, waitForNextUpdate } = renderHook(() => useCategories());
      
      await waitForNextUpdate();
      
      // Update category
      await act(async () => {
        await result.current.updateCategory(updatedCategory);
      });
      
      await waitForNextUpdate();
      
      expect(result.current.categories[0].name).toBe('美食');
    });

    test('should delete category successfully', async () => {
      const initialCategories = [
        { id: 1, name: '餐饮', type: 'expense' },
        { id: 2, name: '交通', type: 'expense' },
      ];
      
      // Mock initial fetch
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: {
            length: 2,
            item: jest.fn((index) => initialCategories[index]),
          },
        });
      
      const { result, waitForNextUpdate } = renderHook(() => useCategories());
      
      await waitForNextUpdate();
      
      // Delete category
      await act(async () => {
        await result.current.deleteCategory(1);
      });
      
      await waitForNextUpdate();
      
      expect(result.current.categories).toHaveLength(1);
      expect(result.current.categories[0].id).toBe(2);
    });
  });

  describe('useBudgets', () => {
    test('should fetch budgets successfully', async () => {
      const mockBudgets = [
        { id: 1, category_id: 1, amount: 1000, start_date: '2024-01-01', end_date: '2024-01-31' },
      ];
      
      mockDatabase.executeSql.mockResolvedValue({
        rows: {
          length: 1,
          item: jest.fn(() => mockBudgets[0]),
        },
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets());
      
      expect(result.current.budgets).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      
      await waitForNextUpdate();
      
      expect(result.current.budgets).toEqual(mockBudgets);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should handle fetch budgets error', async () => {
      mockDatabase.executeSql.mockRejectedValue(new Error('Fetch budgets error'));
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets());
      
      await waitForNextUpdate();
      
      expect(result.current.budgets).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Fetch budgets error');
    });

    test('should add budget successfully', async () => {
      const initialBudgets = [];
      const newBudget = {
        category_id: 1,
        amount: 1000,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      
      // Mock initial fetch
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: { length: 0 },
        })
        .mockResolvedValueOnce({ insertId: 1 });
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets());
      
      await waitForNextUpdate();
      
      // Add budget
      await act(async () => {
        await result.current.addBudget(newBudget);
      });
      
      await waitForNextUpdate();
      
      expect(result.current.budgets).toHaveLength(1);
      expect(result.current.budgets[0].id).toBe(1);
      expect(result.current.budgets[0].amount).toBe(1000);
    });

    test('should update budget successfully', async () => {
      const initialBudgets = [
        { id: 1, category_id: 1, amount: 1000, start_date: '2024-01-01', end_date: '2024-01-31' },
      ];
      const updatedBudget = {
        id: 1,
        category_id: 1,
        amount: 1500,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      
      // Mock initial fetch
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: {
            length: 1,
            item: jest.fn(() => initialBudgets[0]),
          },
        });
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets());
      
      await waitForNextUpdate();
      
      // Update budget
      await act(async () => {
        await result.current.updateBudget(updatedBudget);
      });
      
      await waitForNextUpdate();
      
      expect(result.current.budgets[0].amount).toBe(1500);
    });

    test('should delete budget successfully', async () => {
      const initialBudgets = [
        { id: 1, category_id: 1, amount: 1000, start_date: '2024-01-01', end_date: '2024-01-31' },
      ];
      
      // Mock initial fetch
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: {
            length: 1,
            item: jest.fn(() => initialBudgets[0]),
          },
        });
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets());
      
      await waitForNextUpdate();
      
      // Delete budget
      await act(async () => {
        await result.current.deleteBudget(1);
      });
      
      await waitForNextUpdate();
      
      expect(result.current.budgets).toEqual([]);
    });
  });

  describe('useTransactions', () => {
    test('should fetch transactions successfully', async () => {
      const mockTransactions = [
        { id: 1, amount: 100, type: 'expense', category_id: 1, date: '2024-01-01' },
      ];
      
      mockDatabase.executeSql.mockResolvedValue({
        rows: {
          length: 1,
          item: jest.fn(() => mockTransactions[0]),
        },
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useTransactions());
      
      expect(result.current.transactions).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      
      await waitForNextUpdate();
      
      expect(result.current.transactions).toEqual(mockTransactions);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should handle fetch transactions error', async () => {
      mockDatabase.executeSql.mockRejectedValue(new Error('Fetch transactions error'));
      
      const { result, waitForNextUpdate } = renderHook(() => useTransactions());
      
      await waitForNextUpdate();
      
      expect(result.current.transactions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Fetch transactions error');
    });

    test('should add transaction successfully', async () => {
      const initialTransactions = [];
      const newTransaction = {
        amount: 100,
        type: 'expense',
        category_id: 1,
        date: '2024-01-01',
        description: '午餐',
      };
      
      // Mock initial fetch
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: { length: 0 },
        })
        .mockResolvedValueOnce({ insertId: 1 });
      
      const { result, waitForNextUpdate } = renderHook(() => useTransactions());
      
      await waitForNextUpdate();
      
      // Add transaction
      await act(async () => {
        await result.current.addTransaction(newTransaction);
      });
      
      await waitForNextUpdate();
      
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0].id).toBe(1);
      expect(result.current.transactions[0].amount).toBe(100);
    });

    test('should update transaction successfully', async () => {
      const initialTransactions = [
        { id: 1, amount: 100, type: 'expense', category_id: 1, date: '2024-01-01', description: '午餐' },
      ];
      const updatedTransaction = {
        id: 1,
        amount: 150,
        type: 'expense',
        category_id: 1,
        date: '2024-01-01',
        description: '晚餐',
      };
      
      // Mock initial fetch
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: {
            length: 1,
            item: jest.fn(() => initialTransactions[0]),
          },
        });
      
      const { result, waitForNextUpdate } = renderHook(() => useTransactions());
      
      await waitForNextUpdate();
      
      // Update transaction
      await act(async () => {
        await result.current.updateTransaction(updatedTransaction);
      });
      
      await waitForNextUpdate();
      
      expect(result.current.transactions[0].amount).toBe(150);
      expect(result.current.transactions[0].description).toBe('晚餐');
    });

    test('should delete transaction successfully', async () => {
      const initialTransactions = [
        { id: 1, amount: 100, type: 'expense', category_id: 1, date: '2024-01-01' },
      ];
      
      // Mock initial fetch
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: {
            length: 1,
            item: jest.fn(() => initialTransactions[0]),
          },
        });
      
      const { result, waitForNextUpdate } = renderHook(() => useTransactions());
      
      await waitForNextUpdate();
      
      // Delete transaction
      await act(async () => {
        await result.current.deleteTransaction(1);
      });
      
      await waitForNextUpdate();
      
      expect(result.current.transactions).toEqual([]);
    });

    test('should filter transactions by date range', async () => {
      const mockTransactions = [
        { id: 1, amount: 100, type: 'expense', category_id: 1, date: '2024-01-01' },
        { id: 2, amount: 200, type: 'expense', category_id: 2, date: '2024-01-15' },
        { id: 3, amount: 300, type: 'income', category_id: 3, date: '2024-02-01' },
      ];
      
      // Mock initial fetch
      mockDatabase.executeSql.mockResolvedValue({
        rows: {
          length: 3,
          item: jest.fn((index) => mockTransactions[index]),
        },
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useTransactions());
      
      await waitForNextUpdate();
      
      // Filter by date range
      await act(async () => {
        result.current.setDateRange('2024-01-01', '2024-01-31');
      });
      
      expect(result.current.filteredTransactions).toHaveLength(2);
      expect(result.current.filteredTransactions[0].id).toBe(1);
      expect(result.current.filteredTransactions[1].id).toBe(2);
    });

    test('should filter transactions by category', async () => {
      const mockTransactions = [
        { id: 1, amount: 100, type: 'expense', category_id: 1, date: '2024-01-01' },
        { id: 2, amount: 200, type: 'expense', category_id: 2, date: '2024-01-15' },
        { id: 3, amount: 300, type: 'income', category_id: 3, date: '2024-02-01' },
      ];
      
      // Mock initial fetch
      mockDatabase.executeSql.mockResolvedValue({
        rows: {
          length: 3,
          item: jest.fn((index) => mockTransactions[index]),
        },
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useTransactions());
      
      await waitForNextUpdate();
      
      // Filter by category
      await act(async () => {
        result.current.setCategoryFilter(1);
      });
      
      expect(result.current.filteredTransactions).toHaveLength(1);
      expect(result.current.filteredTransactions[0].id).toBe(1);
      expect(result.current.filteredTransactions[0].category_id).toBe(1);
    });
  });
});
