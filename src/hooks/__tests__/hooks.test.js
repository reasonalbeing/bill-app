import { renderHook, act } from '@testing-library/react-native';
import { useBudgets, useCategories, useDatabase, useTransactions } from '../index';
import BudgetRepository from '../../repositories/BudgetRepository';
import TransactionRepository from '../../repositories/TransactionRepository';

// Mock repositories
jest.mock('../../repositories/BudgetRepository');
jest.mock('../../repositories/TransactionRepository');

// Mock dependencies
jest.mock('../../config/database');

const mockDatabase = require('../../config/database');

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
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should fetch budgets successfully', async () => {
      const mockBudgets = [
        { id: 1, category_id: 1, amount: 1000, start_date: '2024-01-01', end_date: '2024-01-31' },
      ];
      
      BudgetRepository.getByUserId.mockResolvedValue(mockBudgets);
      TransactionRepository.getByUserId.mockResolvedValue([]);
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets('user123'));
      
      expect(result.current.budgets).toEqual([]);
      expect(result.current.loading).toBe(true);
      
      await waitForNextUpdate();
      
      expect(result.current.budgets).toHaveLength(1);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(BudgetRepository.getByUserId).toHaveBeenCalledWith('user123');
    });

    test('should handle fetch budgets error', async () => {
      BudgetRepository.getByUserId.mockRejectedValue(new Error('Fetch budgets error'));
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets('user123'));
      
      await waitForNextUpdate();
      
      expect(result.current.budgets).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Fetch budgets error');
    });

    test('should create budget successfully', async () => {
      const initialBudgets = [];
      const newBudget = {
        category_id: 1,
        amount: 1000,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      
      BudgetRepository.getByUserId.mockResolvedValue([]);
      BudgetRepository.create.mockResolvedValue(1);
      TransactionRepository.getByUserId.mockResolvedValue([]);
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets('user123'));
      
      await waitForNextUpdate();
      
      // Create budget
      const createResult = await act(async () => {
        return await result.current.createBudget(newBudget);
      });
      
      expect(createResult.success).toBe(true);
      expect(createResult.id).toBe(1);
      expect(BudgetRepository.create).toHaveBeenCalledWith({
        ...newBudget,
        user_id: 'user123',
      });
    });

    test('should update budget successfully', async () => {
      const initialBudgets = [
        { id: 1, category_id: 1, amount: 1000, start_date: '2024-01-01', end_date: '2024-01-31' },
      ];
      const updateData = {
        amount: 1500,
      };
      
      BudgetRepository.getByUserId.mockResolvedValue(initialBudgets);
      BudgetRepository.update.mockResolvedValue(true);
      TransactionRepository.getByUserId.mockResolvedValue([]);
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets('user123'));
      
      await waitForNextUpdate();
      
      // Update budget
      const updateResult = await act(async () => {
        return await result.current.updateBudget(1, updateData);
      });
      
      expect(updateResult.success).toBe(true);
      expect(BudgetRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    test('should delete budget successfully', async () => {
      const initialBudgets = [
        { id: 1, category_id: 1, amount: 1000, start_date: '2024-01-01', end_date: '2024-01-31' },
      ];
      
      BudgetRepository.getByUserId.mockResolvedValue(initialBudgets);
      BudgetRepository.delete.mockResolvedValue(true);
      TransactionRepository.getByUserId.mockResolvedValue([]);
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets('user123'));
      
      await waitForNextUpdate();
      
      // Delete budget
      const deleteResult = await act(async () => {
        return await result.current.deleteBudget(1);
      });
      
      expect(deleteResult.success).toBe(true);
      expect(BudgetRepository.delete).toHaveBeenCalledWith(1);
    });

    test('should transfer surplus successfully', async () => {
      const initialBudgets = [
        {
          id: 1,
          category_id: 1,
          amount: 1000,
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          recurring: 'monthly',
          spent: 500,
          remaining: 500,
          surplus: 500,
        },
      ];
      
      BudgetRepository.getByUserId.mockResolvedValue(initialBudgets);
      BudgetRepository.create.mockResolvedValue(2);
      TransactionRepository.getByUserId.mockResolvedValue([]);
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets('user123'));
      
      await waitForNextUpdate();
      
      // Transfer surplus
      const transferResult = await act(async () => {
        return await result.current.transferSurplus(1, 200);
      });
      
      expect(transferResult.success).toBe(true);
      expect(transferResult.newBudgetId).toBe(2);
      expect(BudgetRepository.create).toHaveBeenCalledWith({
        user_id: 'user123',
        amount: 1200, // 1000 + 200
        category_id: 1,
        start_date: expect.any(String),
        end_date: expect.any(String),
        recurring: 'monthly',
        custom_recurring: undefined,
        description: ' (含转入盈余 ¥200.00)',
      });
    });

    test('should handle transfer surplus error for non-existent budget', async () => {
      const initialBudgets = [];
      
      BudgetRepository.getByUserId.mockResolvedValue(initialBudgets);
      TransactionRepository.getByUserId.mockResolvedValue([]);
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets('user123'));
      
      await waitForNextUpdate();
      
      // Transfer surplus for non-existent budget
      const transferResult = await act(async () => {
        return await result.current.transferSurplus(999, 100);
      });
      
      expect(transferResult.success).toBe(false);
      expect(transferResult.error).toBe('预算不存在');
    });

    test('should handle transfer surplus error for invalid amount', async () => {
      const initialBudgets = [
        {
          id: 1,
          category_id: 1,
          amount: 1000,
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          recurring: 'monthly',
          spent: 500,
          remaining: 500,
          surplus: 500,
        },
      ];
      
      BudgetRepository.getByUserId.mockResolvedValue(initialBudgets);
      TransactionRepository.getByUserId.mockResolvedValue([]);
      
      const { result, waitForNextUpdate } = renderHook(() => useBudgets('user123'));
      
      await waitForNextUpdate();
      
      // Transfer surplus with invalid amount
      const transferResult = await act(async () => {
        return await result.current.transferSurplus(1, 600); // 超过盈余金额
      });
      
      expect(transferResult.success).toBe(false);
      expect(transferResult.error).toBe('无效的转入金额');
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
