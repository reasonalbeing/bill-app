import BudgetRepository from '../BudgetRepository';
import { getDatabase } from '../../config/database';

jest.mock('../../config/database', () => ({
  getDatabase: jest.fn(),
}));

describe('BudgetRepository', () => {
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
    it('should return budgets for user', async () => {
      const mockBudgets = [
        { id: 1, amount: 5000, spent_amount: 3000 },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockBudgets);

      const result = await BudgetRepository.getByUserId(1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT b.*, c.name as category_name'),
        [1]
      );
      expect(result).toEqual(mockBudgets);
    });

    it('should filter active budgets with date range', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await BudgetRepository.getByUserId(1, {
        activeOnly: true,
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('b.start_date <= ? AND b.end_date >= ?'),
        expect.arrayContaining([1, '2024-01-31', '2024-01-01'])
      );
    });
  });

  describe('getBudgetWithStats', () => {
    it('should return budget with statistics', async () => {
      const mockBudget = {
        id: 1,
        amount: 5000,
        category_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      mockDb.getFirstAsync
        .mockResolvedValueOnce(mockBudget)
        .mockResolvedValueOnce({ spent: 3000 });

      const result = await BudgetRepository.getBudgetWithStats(1, 1);

      expect(result).toEqual({
        ...mockBudget,
        spent: 3000,
        remaining: 2000,
        percentage: 60,
      });
    });

    it('should return null if budget not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await BudgetRepository.getBudgetWithStats(999, 1);

      expect(result).toBeNull();
    });

    it('should cap percentage at 100', async () => {
      const mockBudget = {
        id: 1,
        amount: 1000,
        category_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      mockDb.getFirstAsync
        .mockResolvedValueOnce(mockBudget)
        .mockResolvedValueOnce({ spent: 2000 });

      const result = await BudgetRepository.getBudgetWithStats(1, 1);

      expect(result.percentage).toBe(100);
    });
  });

  describe('getActiveBudgets', () => {
    it('should return active budgets for current date', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await BudgetRepository.getActiveBudgets(1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('b.start_date <= ? AND b.end_date >= ?'),
        expect.any(Array)
      );
    });

    it('should accept custom current date', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await BudgetRepository.getActiveBudgets(1, '2024-06-15');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, '2024-06-15', '2024-06-15'])
      );
    });
  });

  describe('getByCategory', () => {
    it('should return budget by category', async () => {
      const mockBudget = { id: 1, category_id: 2 };
      mockDb.getFirstAsync.mockResolvedValue(mockBudget);

      const result = await BudgetRepository.getByCategory(1, 2);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('category_id = ?'),
        expect.arrayContaining([1, 2])
      );
      expect(result).toEqual(mockBudget);
    });
  });

  describe('getTotalBudget', () => {
    it('should return total budget (without category)', async () => {
      const mockBudget = { id: 1, category_id: null, amount: 10000 };
      mockDb.getFirstAsync.mockResolvedValue(mockBudget);

      const result = await BudgetRepository.getTotalBudget(1);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('category_id IS NULL'),
        expect.any(Array)
      );
      expect(result).toEqual(mockBudget);
    });
  });

  describe('checkBudgetStatus', () => {
    it('should return budget status when over budget', async () => {
      const mockBudget = {
        id: 1,
        amount: 1000,
        category_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      mockDb.getFirstAsync
        .mockResolvedValueOnce(mockBudget)
        .mockResolvedValueOnce({ spent: 1500 });

      const result = await BudgetRepository.checkBudgetStatus(1, 1);

      expect(result.isOverBudget).toBe(true);
      expect(result.isNearLimit).toBe(true);
      expect(result.percentage).toBe(100);
      expect(result.remaining).toBe(-500);
    });

    it('should return budget status when near limit', async () => {
      const mockBudget = {
        id: 1,
        amount: 1000,
        category_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      mockDb.getFirstAsync
        .mockResolvedValueOnce(mockBudget)
        .mockResolvedValueOnce({ spent: 850 });

      const result = await BudgetRepository.checkBudgetStatus(1, 1);

      expect(result.isOverBudget).toBe(false);
      expect(result.isNearLimit).toBe(true);
      expect(result.percentage).toBe(85);
    });

    it('should return null if budget not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await BudgetRepository.checkBudgetStatus(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('getBudgetHistory', () => {
    it('should return budget history', async () => {
      const mockHistory = [
        { id: 1, amount: 5000, spent_amount: 4500 },
        { id: 2, amount: 4000, spent_amount: 3000 },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockHistory);

      const result = await BudgetRepository.getBudgetHistory(1, 10);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY b.end_date DESC'),
        [1, 10]
      );
      expect(result).toEqual(mockHistory);
    });

    it('should use default limit', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await BudgetRepository.getBudgetHistory(1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        [1, 10]
      );
    });
  });

  describe('getBudgetTrend', () => {
    it('should return budget trend for specified months', async () => {
      const mockTrend = [
        { month: '2024-01', total_budget: 5000, total_spent: 4500 },
        { month: '2024-02', total_budget: 5000, total_spent: 4800 },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockTrend);

      const result = await BudgetRepository.getBudgetTrend(1, 6);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("strftime('%Y-%m', b.start_date)"),
        [1]
      );
      expect(result).toEqual(mockTrend);
    });

    it('should use default months', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await BudgetRepository.getBudgetTrend(1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("date('now', '-6 months')"),
        [1]
      );
    });
  });

  describe('createRecurringBudget', () => {
    it('should create monthly recurring budget', async () => {
      const mockBudget = {
        id: 1,
        user_id: 1,
        amount: 5000,
        category_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        recurring: 'monthly',
        description: 'Monthly budget',
      };
      mockDb.getFirstAsync.mockResolvedValue(mockBudget);
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 2 });

      const result = await BudgetRepository.createRecurringBudget(1);

      expect(result).toBe(2);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO budgets'),
        expect.arrayContaining([
          1, 5000, 2,
          '2024-02-01', // 开始日期加一个月
          'monthly', 'Monthly budget',
        ])
      );
    });

    it('should create yearly recurring budget', async () => {
      const mockBudget = {
        id: 1,
        user_id: 1,
        amount: 60000,
        category_id: null,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        recurring: 'yearly',
        description: 'Yearly budget',
      };
      mockDb.getFirstAsync.mockResolvedValue(mockBudget);
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 2 });

      const result = await BudgetRepository.createRecurringBudget(1);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          1, 60000, null,
          '2025-01-01', '2025-12-31',
        ])
      );
    });

    it('should return null if budget not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await BudgetRepository.createRecurringBudget(999);

      expect(result).toBeNull();
    });

    it('should return null if not recurring', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: 1,
        recurring: 'none',
      });

      const result = await BudgetRepository.createRecurringBudget(1);

      expect(result).toBeNull();
    });

    it('should create daily recurring budget', async () => {
      const mockBudget = {
        id: 1,
        user_id: 1,
        amount: 100,
        category_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-01-01',
        recurring: 'daily',
        description: 'Daily budget',
      };
      mockDb.getFirstAsync.mockResolvedValue(mockBudget);
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 2 });

      const result = await BudgetRepository.createRecurringBudget(1);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          1, 100, 2,
          '2024-01-02', '2024-01-02',
        ])
      );
    });

    it('should create weekly recurring budget', async () => {
      const mockBudget = {
        id: 1,
        user_id: 1,
        amount: 700,
        category_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-01-07',
        recurring: 'weekly',
        description: 'Weekly budget',
      };
      mockDb.getFirstAsync.mockResolvedValue(mockBudget);
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 2 });

      const result = await BudgetRepository.createRecurringBudget(1);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          1, 700, 2,
          '2024-01-08', '2024-01-14',
        ])
      );
    });

    it('should handle custom recurring budget', async () => {
      const mockBudget = {
        id: 1,
        user_id: 1,
        amount: 2000,
        category_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-01-15',
        recurring: 'custom',
        custom_recurring: {
          frequency: 'daily',
          interval: 15
        },
        description: 'Custom budget',
      };
      mockDb.getFirstAsync.mockResolvedValue(mockBudget);
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 2 });

      const result = await BudgetRepository.createRecurringBudget(1);

      expect(result).toBe(2);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO budgets'),
        expect.arrayContaining([
          1, 2000, 2,
          '2024-01-16', // 开始日期加15天
          'custom', 'Custom budget',
        ])
      );
    });
  });
});
