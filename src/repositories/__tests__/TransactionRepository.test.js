import TransactionRepository from '../TransactionRepository';
import { getDatabase } from '../../config/database';

// Mock database module
jest.mock('../../config/database', () => ({
  getDatabase: jest.fn(),
}));

describe('TransactionRepository', () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
    };

    getDatabase.mockResolvedValue(mockDb);
  });

  describe('getByUserId', () => {
    it('should return transactions for user with basic options', async () => {
      const mockTransactions = [
        { id: 1, amount: 100, type: 'expense', category_name: 'Food' },
        { id: 2, amount: 200, type: 'income', category_name: 'Salary' },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockTransactions);

      const result = await TransactionRepository.getByUserId(1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.*, c.name as category_name'),
        [1, 100, 0]
      );
      expect(result).toEqual(mockTransactions);
    });

    it('should filter by type', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getByUserId(1, { type: 'expense' });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("AND type = ?"),
        expect.arrayContaining([1, 'expense'])
      );
    });

    it('should filter by date range', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getByUserId(1, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND date >= ?'),
        expect.arrayContaining([1, '2024-01-01', '2024-01-31'])
      );
    });

    it('should filter by category', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getByUserId(1, { categoryId: 5 });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND category_id = ?'),
        expect.arrayContaining([1, 5])
      );
    });

    it('should apply limit and offset', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getByUserId(1, { limit: 20, offset: 40 });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 20, 40])
      );
    });
  });

  describe('getStatistics', () => {
    it('should return complete statistics', async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ total: 5000 })  // income
        .mockResolvedValueOnce({ total: 3000 }); // expense

      mockDb.getAllAsync
        .mockResolvedValueOnce([  // categoryStats
          { category_name: 'Food', total_amount: 1500, transaction_count: 10 },
        ])
        .mockResolvedValueOnce([  // dailyStats
          { date: '2024-01-01', income: 100, expense: 50 },
        ]);

      const result = await TransactionRepository.getStatistics(1, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result).toEqual({
        totalIncome: 5000,
        totalExpense: 3000,
        balance: 2000,
        categoryStats: [{ category_name: 'Food', total_amount: 1500, transaction_count: 10 }],
        dailyStats: [{ date: '2024-01-01', income: 100, expense: 50 }],
      });
    });

    it('should handle null results', async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockDb.getAllAsync
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await TransactionRepository.getStatistics(1);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.balance).toBe(0);
    });
  });

  describe('findDuplicate', () => {
    it('should find duplicate transactions', async () => {
      const mockDuplicates = [{ id: 1, amount: 100, date: '2024-01-01' }];
      mockDb.getAllAsync.mockResolvedValue(mockDuplicates);

      const transaction = {
        amount: 100,
        date: '2024-01-01',
        description: 'Test transaction',
        importSource: 'alipay',
      };

      const result = await TransactionRepository.findDuplicate(1, transaction);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('user_id = ?'),
        [1, 100, '2024-01-01', 'Test transaction', 'alipay']
      );
      expect(result).toEqual(mockDuplicates);
    });

    it('should return empty array if no duplicates', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await TransactionRepository.findDuplicate(1, {
        amount: 999,
        date: '2024-01-01',
        description: 'Unique',
        importSource: 'manual',
      });

      expect(result).toEqual([]);
    });
  });

  describe('batchCreate', () => {
    it('should batch insert transactions successfully', async () => {
      mockDb.getAllAsync.mockResolvedValue([]); // No duplicates
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });

      const transactions = [
        { user_id: 1, amount: 100, description: 'Test 1' },
        { user_id: 1, amount: 200, description: 'Test 2' },
      ];

      const result = await TransactionRepository.batchCreate(transactions);

      expect(result).toEqual({
        success: 2,
        failed: 0,
        duplicates: 0,
        errors: [],
      });
      expect(mockDb.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockDb.execAsync).toHaveBeenCalledWith('COMMIT');
    });

    it('should skip duplicate transactions', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ id: 1 }]); // Found duplicate

      const transactions = [
        { user_id: 1, amount: 100, description: 'Duplicate' },
      ];

      const result = await TransactionRepository.batchCreate(transactions);

      expect(result.duplicates).toBe(1);
      expect(result.success).toBe(0);
    });

    it('should handle individual transaction errors', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      mockDb.runAsync.mockRejectedValue(new Error('Insert failed'));

      const transactions = [
        { user_id: 1, amount: 100, description: 'Test' },
      ];

      const result = await TransactionRepository.batchCreate(transactions);

      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Insert failed');
    });

    it('should rollback on transaction error', async () => {
      mockDb.execAsync
        .mockResolvedValueOnce(undefined) // BEGIN TRANSACTION succeeds
        .mockRejectedValueOnce(new Error('Transaction failed')); // COMMIT fails

      await expect(TransactionRepository.batchCreate([])).rejects.toThrow('Transaction failed');
      expect(mockDb.execAsync).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getByDateRange', () => {
    it('should call getByUserId with date range options', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getByDateRange(1, '2024-01-01', '2024-01-31');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('date >= ?'),
        expect.arrayContaining([1, '2024-01-01', '2024-01-31'])
      );
    });
  });

  describe('getRecent', () => {
    it('should return recent transactions with default limit', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getRecent(1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 10, 0])
      );
    });

    it('should return recent transactions with custom limit', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getRecent(1, 5);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 5, 0])
      );
    });
  });

  describe('getPlatformStats', () => {
    it('should return platform statistics', async () => {
      const mockStats = [
        { platform: 'alipay', total_amount: 2000, transaction_count: 20 },
        { platform: 'wechat', total_amount: 1000, transaction_count: 15 },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockStats);

      const result = await TransactionRepository.getPlatformStats(1, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY platform'),
        expect.arrayContaining([1, 'expense', '2024-01-01', '2024-01-31'])
      );
      expect(result).toEqual(mockStats);
    });

    it('should work without date range', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getPlatformStats(1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('user_id = ? AND type = ?'),
        [1, 'expense']
      );
    });

    it('should work with only start date', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getPlatformStats(1, {
        startDate: '2024-01-01',
      });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND date >= ?'),
        expect.arrayContaining([1, 'expense', '2024-01-01'])
      );
    });

    it('should work with only end date', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await TransactionRepository.getPlatformStats(1, {
        endDate: '2024-01-31',
      });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND date <= ?'),
        expect.arrayContaining([1, 'expense', '2024-01-31'])
      );
    });
  });
});
