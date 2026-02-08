import BaseRepository from '../BaseRepository';
import { getDatabase } from '../../config/database';

// Mock database module
jest.mock('../../config/database', () => ({
  getDatabase: jest.fn(),
}));

describe('BaseRepository', () => {
  let repository;
  let mockDb;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock database
    mockDb = {
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
    };

    getDatabase.mockResolvedValue(mockDb);

    // Create repository instance
    repository = new BaseRepository('test_table');
  });

  describe('constructor', () => {
    it('should set table name correctly', () => {
      expect(repository.tableName).toBe('test_table');
    });
  });

  describe('getDb', () => {
    it('should return database instance', async () => {
      const db = await repository.getDb();
      expect(db).toBe(mockDb);
      expect(getDatabase).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all records without where clause', async () => {
      const mockData = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test 2' }];
      mockDb.getAllAsync.mockResolvedValue(mockData);

      const result = await repository.findAll();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM test_table  ORDER BY id DESC',
        []
      );
      expect(result).toEqual(mockData);
    });

    it('should return filtered records with where clause', async () => {
      const mockData = [{ id: 1, name: 'Test', status: 'active' }];
      mockDb.getAllAsync.mockResolvedValue(mockData);

      const result = await repository.findAll('status = ?', ['active'], 'name ASC');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE status = ? ORDER BY name ASC',
        ['active']
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('findById', () => {
    it('should return record by id', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockDb.getFirstAsync.mockResolvedValue(mockData);

      const result = await repository.findById(1);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE id = ?',
        [1]
      );
      expect(result).toEqual(mockData);
    });

    it('should return null if record not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should insert new record and return id', async () => {
      const mockResult = { lastInsertRowId: 5 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const data = { name: 'Test', status: 'active' };
      const result = await repository.create(data);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO test_table (name,status) VALUES (?,?)',
        ['Test', 'active']
      );
      expect(result).toBe(5);
    });

    it('should handle empty data object', async () => {
      const mockResult = { lastInsertRowId: 1 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const result = await repository.create({});

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO test_table () VALUES ()',
        []
      );
    });
  });

  describe('update', () => {
    it('should update record and return true on success', async () => {
      const mockResult = { changes: 1 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const data = { name: 'Updated', status: 'inactive' };
      const result = await repository.update(1, data);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE test_table SET name = ?,status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['Updated', 'inactive', 1]
      );
      expect(result).toBe(true);
    });

    it('should return false if no record updated', async () => {
      const mockResult = { changes: 0 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const result = await repository.update(999, { name: 'Test' });

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete record and return true on success', async () => {
      const mockResult = { changes: 1 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const result = await repository.delete(1);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM test_table WHERE id = ?',
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false if no record deleted', async () => {
      const mockResult = { changes: 0 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const result = await repository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('deleteWhere', () => {
    it('should delete records matching condition', async () => {
      const mockResult = { changes: 3 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const result = await repository.deleteWhere('status = ?', ['inactive']);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM test_table WHERE status = ?',
        ['inactive']
      );
      expect(result).toBe(3);
    });
  });

  describe('query', () => {
    it('should execute raw SQL query', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      mockDb.getAllAsync.mockResolvedValue(mockData);

      const result = await repository.query('SELECT * FROM test_table WHERE id > ?', [0]);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE id > ?',
        [0]
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('execute', () => {
    it('should execute raw SQL statement', async () => {
      const mockResult = { changes: 1 };
      mockDb.runAsync.mockResolvedValue(mockResult);

      const result = await repository.execute('UPDATE test_table SET status = ?', ['active']);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE test_table SET status = ?',
        ['active']
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('count', () => {
    it('should return total count without where clause', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 10 });

      const result = await repository.count();

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM test_table ',
        []
      );
      expect(result).toBe(10);
    });

    it('should return filtered count with where clause', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 5 });

      const result = await repository.count('status = ?', ['active']);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM test_table WHERE status = ?',
        ['active']
      );
      expect(result).toBe(5);
    });

    it('should return 0 if result is null', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });
});
