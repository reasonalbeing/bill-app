// 导入syncService模块
const syncService = require('../syncService');
const { syncToCloud, syncFromCloud, syncBidirectional, getLastSyncTime, SYNC_STATUS } = syncService;

// Mock配置模块
jest.mock('../../config/firebase', () => ({
  default: {},
}));

// 导入模块
import { getDatabase } from '../../config/database';

describe('syncService', () => {
  let mockDatabase;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock database
    mockDatabase = {
      executeSql: jest.fn(),
    };
    
    // 设置mock
    syncService.setDatabaseMock(mockDatabase);
    syncService.setGetCurrentUserIdMock('test-user-id');
  });
  
  afterEach(() => {
    // 清除mock
    syncService.clearMocks();
  });

  describe('SYNC_STATUS', () => {
    it('should have correct sync status values', () => {
      expect(SYNC_STATUS.IDLE).toBe('idle');
      expect(SYNC_STATUS.SYNCING).toBe('syncing');
      expect(SYNC_STATUS.SUCCESS).toBe('success');
      expect(SYNC_STATUS.ERROR).toBe('error');
      expect(SYNC_STATUS.CONFLICT).toBe('conflict');
    });

    it('should have all required status properties', () => {
      expect(SYNC_STATUS).toHaveProperty('IDLE');
      expect(SYNC_STATUS).toHaveProperty('SYNCING');
      expect(SYNC_STATUS).toHaveProperty('SUCCESS');
      expect(SYNC_STATUS).toHaveProperty('ERROR');
      expect(SYNC_STATUS).toHaveProperty('CONFLICT');
    });
  });

  describe('getLastSyncTime', () => {
    it('should return sync time when it exists', async () => {
      const mockSyncTime = '2024-01-01T00:00:00.000Z';
      mockDatabase.executeSql.mockResolvedValue({
        rows: {
          length: 1,
          item: () => ({ value: mockSyncTime }),
        },
      });
      
      const result = await getLastSyncTime();
      
      expect(result).toBe(mockSyncTime);
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        'SELECT value FROM settings WHERE key = ?',
        ['last_sync_time']
      );
    });

    it('should return null when sync time does not exist', async () => {
      mockDatabase.executeSql.mockResolvedValue({
        rows: {
          length: 0,
        },
      });
      
      const result = await getLastSyncTime();
      
      expect(result).toBe(null);
    });

    it('should return null on error', async () => {
      const mockError = new Error('Database error');
      mockDatabase.executeSql.mockRejectedValue(mockError);
      
      const result = await getLastSyncTime();
      
      expect(result).toBe(null);
    });
  });

  describe('syncToCloud', () => {
    it('should throw error when user is not logged in', async () => {
      // Mock user not logged in
      syncService.setGetCurrentUserIdMock(null);
      await expect(syncToCloud()).rejects.toThrow('用户未登录');
    });

    it('should sync data to cloud successfully', async () => {
      // Setup mock database responses
      mockDatabase.executeSql
        .mockResolvedValueOnce({
          rows: {
            length: 0,
          },
        })
        .mockResolvedValueOnce({
          rows: {
            length: 0,
          },
        })
        .mockResolvedValueOnce({
          rows: {
            length: 0,
          },
        })
        .mockResolvedValueOnce({
          rows: {
            length: 0,
          },
        });
      
      const mockProgressCallback = jest.fn();
      
      // This will use the mock implementation in syncService.js
      const result = await syncToCloud(mockProgressCallback);
      
      expect(result).toEqual({ success: true, message: '同步到云端成功' });
      expect(mockProgressCallback).toHaveBeenCalled();
    });

    it('should handle error during sync', async () => {
      // Setup mock database error
      const mockError = new Error('Sync error');
      mockDatabase.executeSql.mockRejectedValue(mockError);
      
      await expect(syncToCloud()).rejects.toThrow('Sync error');
    });
  });

  describe('syncFromCloud', () => {
    it('should throw error when user is not logged in', async () => {
      // Mock user not logged in
      syncService.setGetCurrentUserIdMock(null);
      await expect(syncFromCloud()).rejects.toThrow('用户未登录');
    });

    it('should sync data from cloud successfully', async () => {
      // Setup mock database responses
      mockDatabase.executeSql
        .mockResolvedValue({
          rows: {
            length: 0,
          },
        });
      
      const mockProgressCallback = jest.fn();
      
      // This will use the mock implementation in syncService.js
      const result = await syncFromCloud(mockProgressCallback);
      
      expect(result).toEqual({ success: true, message: '从云端同步成功' });
      expect(mockProgressCallback).toHaveBeenCalled();
    });

    it('should handle error during sync', async () => {
      // Setup mock database error
      const mockError = new Error('Sync error');
      mockDatabase.executeSql.mockRejectedValue(mockError);
      
      await expect(syncFromCloud()).rejects.toThrow('Sync error');
    });
  });

  describe('syncBidirectional', () => {
    it('should throw error when user is not logged in', async () => {
      // Mock user not logged in
      syncService.setGetCurrentUserIdMock(null);
      await expect(syncBidirectional()).rejects.toThrow('用户未登录');
    });

    it('should sync bidirectionally successfully', async () => {
      // Setup mock database responses
      mockDatabase.executeSql
        .mockResolvedValue({
          rows: {
            length: 0,
          },
        });
      
      const mockProgressCallback = jest.fn();
      
      // This will use the mock implementation in syncService.js
      const result = await syncBidirectional(mockProgressCallback);
      
      expect(result).toEqual({ success: true, message: '双向同步成功' });
      expect(mockProgressCallback).toHaveBeenCalled();
    });

    it('should handle error during bidirectional sync', async () => {
      // Setup mock database error
      const mockError = new Error('Sync error');
      mockDatabase.executeSql.mockRejectedValue(mockError);
      
      await expect(syncBidirectional()).rejects.toThrow('Sync error');
    });
  });
});