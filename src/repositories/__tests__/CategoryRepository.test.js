import CategoryRepository from '../CategoryRepository';
import { getDatabase } from '../../config/database';

jest.mock('../../config/database', () => ({
  getDatabase: jest.fn(),
}));

describe('CategoryRepository', () => {
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

  describe('getAll', () => {
    it('should return all categories with default options', async () => {
      const mockCategories = [
        { id: 1, name: 'Food', type: 'expense' },
        { id: 2, name: 'Salary', type: 'income' },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockCategories);

      const result = await CategoryRepository.getAll();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM categories'),
        []
      );
      expect(result).toEqual(mockCategories);
    });

    it('should filter by type', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await CategoryRepository.getAll({ type: 'expense' });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('type = ?'),
        ['expense']
      );
    });

    it('should filter by userId with default categories', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await CategoryRepository.getAll({ userId: 1 });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('(is_default = TRUE OR user_id = ?)'),
        [1]
      );
    });

    it('should filter by userId without default categories', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await CategoryRepository.getAll({ userId: 1, includeDefault: false });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('user_id = ?'),
        [1]
      );
    });
  });

  describe('getByType', () => {
    it('should call getAll with type filter', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await CategoryRepository.getByType('expense', 1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('type = ?'),
        expect.arrayContaining(['expense', 1])
      );
    });
  });

  describe('getDefaultCategories', () => {
    it('should return all default categories', async () => {
      const mockCategories = [{ id: 1, name: 'Food', is_default: true }];
      mockDb.getAllAsync.mockResolvedValue(mockCategories);

      const result = await CategoryRepository.getDefaultCategories();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('is_default = TRUE'),
        []
      );
      expect(result).toEqual(mockCategories);
    });

    it('should filter default categories by type', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await CategoryRepository.getDefaultCategories('income');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('is_default = TRUE AND type = ?'),
        ['income']
      );
    });
  });

  describe('getUserCategories', () => {
    it('should return user custom categories', async () => {
      const mockCategories = [{ id: 2, name: 'Custom', user_id: 1 }];
      mockDb.getAllAsync.mockResolvedValue(mockCategories);

      const result = await CategoryRepository.getUserCategories(1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('user_id = ? AND is_default = FALSE'),
        [1]
      );
      expect(result).toEqual(mockCategories);
    });

    it('should filter user categories by type', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await CategoryRepository.getUserCategories(1, 'expense');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND type = ?'),
        [1, 'expense']
      );
    });
  });

  describe('findByName', () => {
    it('should find category by name', async () => {
      const mockCategory = { id: 1, name: 'Food' };
      mockDb.getFirstAsync.mockResolvedValue(mockCategory);

      const result = await CategoryRepository.findByName('Food', 'expense', 1);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('name = ? AND type = ?'),
        ['Food', 'expense', 1]
      );
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await CategoryRepository.findByName('Unknown', 'expense', 1);

      expect(result).toBeNull();
    });
  });

  describe('getNextOrderIndex', () => {
    it('should return next order index', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ max_index: 5 });

      const result = await CategoryRepository.getNextOrderIndex('expense');

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('MAX(order_index)'),
        ['expense']
      );
      expect(result).toBe(6);
    });

    it('should return 1 if no categories exist', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ max_index: null });

      const result = await CategoryRepository.getNextOrderIndex('expense');

      expect(result).toBe(1);
    });
  });

  describe('initializeDefaultCategoriesForUser', () => {
    it('should create user copies of default categories', async () => {
      const defaultCategories = [
        { id: 1, name: 'Food', type: 'expense', icon: 'food', color: '#FF0000', order_index: 1 },
        { id: 2, name: 'Transport', type: 'expense', icon: 'car', color: '#00FF00', order_index: 2 },
      ];
      mockDb.getAllAsync.mockResolvedValue(defaultCategories);
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });

      await CategoryRepository.initializeDefaultCategoriesForUser(1);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('is_default = TRUE'),
        []
      );
      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateOrder', () => {
    it('should update category order', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      await CategoryRepository.updateOrder([3, 1, 2]);

      expect(mockDb.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET order_index = ?'),
        [1, 3]
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET order_index = ?'),
        [2, 1]
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET order_index = ?'),
        [3, 2]
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith('COMMIT');
    });

    it('should rollback on error', async () => {
      mockDb.runAsync.mockRejectedValue(new Error('Update failed'));

      await expect(CategoryRepository.updateOrder([1, 2])).rejects.toThrow('Update failed');
      expect(mockDb.execAsync).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('isInUse', () => {
    it('should return true if category is in use', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 5 });

      const result = await CategoryRepository.isInUse(1);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as count FROM transactions'),
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false if category is not in use', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });

      const result = await CategoryRepository.isInUse(1);

      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return category statistics', async () => {
      const mockStats = {
        transaction_count: 10,
        total_amount: 5000,
        first_transaction: '2024-01-01',
        last_transaction: '2024-01-31',
      };
      mockDb.getFirstAsync.mockResolvedValue(mockStats);

      const result = await CategoryRepository.getStatistics(1, 1);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as transaction_count'),
        [1, 1]
      );
      expect(result).toEqual({
        transactionCount: 10,
        totalAmount: 5000,
        firstTransaction: '2024-01-01',
        lastTransaction: '2024-01-31',
      });
    });

    it('should handle null result', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await CategoryRepository.getStatistics(1, 1);

      expect(result).toEqual({
        transactionCount: 0,
        totalAmount: 0,
        firstTransaction: undefined,
        lastTransaction: undefined,
      });
    });
  });
});
