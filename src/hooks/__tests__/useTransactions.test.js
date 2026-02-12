// Test useTransactions hook functionality

// Mock dependencies
jest.mock('../../repositories/TransactionRepository');

// Import dependencies
import { renderHook, act } from '@testing-library/react-native';
import TransactionRepository from '../../repositories/TransactionRepository';
import useTransactions from '../useTransactions';

const mockUserId = '1';

describe('useTransactions Hook', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with empty state when userId is null', async () => {
      const { result } = renderHook(() => useTransactions(null));

      expect(result.current.transactions).toEqual([]);
      expect(result.current.statistics).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should load transactions when userId is provided', async () => {
      const mockTransactions = [
        {
          id: '1',
          user_id: mockUserId,
          amount: '100',
          type: 'expense',
          category_id: '1',
          date: '2024-01-01'
        }
      ];

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);

      const { result } = renderHook(() => useTransactions(mockUserId));

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    test('should handle transactions loading error', async () => {
      TransactionRepository.getByUserId.mockRejectedValue(new Error('Loading transactions error'));

      const { result } = renderHook(() => useTransactions(mockUserId));

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    test('should load transactions with options', async () => {
      const mockOptions = { type: 'expense', startDate: '2024-01-01', endDate: '2024-01-31' };
      const mockTransactions = [
        {
          id: '1',
          user_id: mockUserId,
          amount: '100',
          type: 'expense',
          category_id: '1',
          date: '2024-01-15'
        }
      ];

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);

      const { result } = renderHook(() => useTransactions(mockUserId, mockOptions));

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Transaction Management', () => {
    test('should create transaction successfully', async () => {
      const mockTransactions = [];
      const mockTransactionData = {
        amount: '100',
        type: 'expense',
        category_id: '1',
        date: '2024-01-01',
        description: 'Test transaction'
      };

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.create.mockResolvedValue('2');

      const { result } = renderHook(() => useTransactions(mockUserId));

      let createResult;
      await act(async () => {
        createResult = await result.current.createTransaction(mockTransactionData);
      });
      
      expect(createResult.success).toBe(true);
      expect(createResult.id).toBe('2');
      expect(TransactionRepository.create).toHaveBeenCalledWith({
        ...mockTransactionData,
        user_id: mockUserId
      });
    });

    test('should handle transaction creation error', async () => {
      const mockTransactions = [];
      const mockTransactionData = {
        amount: '100',
        type: 'expense',
        category_id: '1',
        date: '2024-01-01'
      };

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.create.mockRejectedValue(new Error('Create transaction error'));

      const { result } = renderHook(() => useTransactions(mockUserId));

      let createResult;
      await act(async () => {
        createResult = await result.current.createTransaction(mockTransactionData);
      });
      
      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe('Create transaction error');
    });

    test('should update transaction successfully', async () => {
      const mockTransactions = [
        {
          id: '1',
          user_id: mockUserId,
          amount: '100',
          type: 'expense',
          category_id: '1',
          date: '2024-01-01'
        }
      ];

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.update.mockResolvedValue(true);

      const { result } = renderHook(() => useTransactions(mockUserId));

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateTransaction('1', { amount: '150' });
      });
      
      expect(updateResult.success).toBe(true);
      expect(TransactionRepository.update).toHaveBeenCalledWith('1', { amount: '150' });
    });

    test('should handle transaction update error', async () => {
      const mockTransactions = [
        {
          id: '1',
          user_id: mockUserId,
          amount: '100',
          type: 'expense',
          category_id: '1',
          date: '2024-01-01'
        }
      ];

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.update.mockRejectedValue(new Error('Update transaction error'));

      const { result } = renderHook(() => useTransactions(mockUserId));

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateTransaction('1', { amount: '150' });
      });
      
      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toBe('Update transaction error');
    });

    test('should delete transaction successfully', async () => {
      const mockTransactions = [
        {
          id: '1',
          user_id: mockUserId,
          amount: '100',
          type: 'expense',
          category_id: '1',
          date: '2024-01-01'
        }
      ];

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.delete.mockResolvedValue(true);

      const { result } = renderHook(() => useTransactions(mockUserId));

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteTransaction('1');
      });
      
      expect(deleteResult.success).toBe(true);
      expect(TransactionRepository.delete).toHaveBeenCalledWith('1');
    });

    test('should handle transaction deletion error', async () => {
      const mockTransactions = [
        {
          id: '1',
          user_id: mockUserId,
          amount: '100',
          type: 'expense',
          category_id: '1',
          date: '2024-01-01'
        }
      ];

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.delete.mockRejectedValue(new Error('Delete transaction error'));

      const { result } = renderHook(() => useTransactions(mockUserId));

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteTransaction('1');
      });
      
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe('Delete transaction error');
    });

    test('should import transactions successfully', async () => {
      const mockTransactions = [];
      const mockImportData = [
        {
          amount: '100',
          type: 'expense',
          category_id: '1',
          date: '2024-01-01',
          description: 'Imported transaction 1'
        },
        {
          amount: '200',
          type: 'income',
          category_id: '2',
          date: '2024-01-02',
          description: 'Imported transaction 2'
        }
      ];

      const mockBatchResult = {
        successCount: 2,
        failureCount: 0,
        failures: []
      };

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.batchCreate.mockResolvedValue(mockBatchResult);

      const { result } = renderHook(() => useTransactions(mockUserId));

      let importResult;
      await act(async () => {
        importResult = await result.current.importTransactions(mockImportData);
      });
      
      expect(importResult.success).toBe(true);
      expect(importResult.successCount).toBe(2);
      expect(TransactionRepository.batchCreate).toHaveBeenCalledWith(
        mockImportData.map(t => ({ ...t, user_id: mockUserId }))
      );
    });

    test('should handle import transactions error', async () => {
      const mockTransactions = [];
      const mockImportData = [
        {
          amount: '100',
          type: 'expense',
          category_id: '1',
          date: '2024-01-01'
        }
      ];

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.batchCreate.mockRejectedValue(new Error('Import transactions error'));

      const { result } = renderHook(() => useTransactions(mockUserId));

      let importResult;
      await act(async () => {
        importResult = await result.current.importTransactions(mockImportData);
      });
      
      expect(importResult.success).toBe(false);
      expect(importResult.error).toBe('Import transactions error');
    });
  });

  describe('Statistics Management', () => {
    test('should load statistics successfully', async () => {
      const mockTransactions = [];
      const mockStatistics = {
        totalIncome: 1000,
        totalExpense: 600,
        balance: 400,
        categoryBreakdown: [
          { category_id: '1', name: '餐饮', amount: 200, percentage: 33.33 },
          { category_id: '2', name: '交通', amount: 150, percentage: 25 }
        ]
      };

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.getStatistics.mockResolvedValue(mockStatistics);

      const { result } = renderHook(() => useTransactions(mockUserId));

      await act(async () => {
        await result.current.loadStatistics({ startDate: '2024-01-01', endDate: '2024-01-31' });
      });

      expect(TransactionRepository.getStatistics).toHaveBeenCalledWith(
        mockUserId,
        { startDate: '2024-01-01', endDate: '2024-01-31' }
      );
    });

    test('should handle statistics loading error', async () => {
      const mockTransactions = [];

      TransactionRepository.getByUserId.mockResolvedValue(mockTransactions);
      TransactionRepository.getStatistics.mockRejectedValue(new Error('Statistics error'));

      const { result } = renderHook(() => useTransactions(mockUserId));

      await act(async () => {
        await result.current.loadStatistics();
      });

      // Should handle error gracefully, statistics should remain null
      expect(result.current.statistics).toBe(null);
    });
  });
});