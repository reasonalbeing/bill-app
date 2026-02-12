// 在测试环境中，使用 require 来导入模块，以便能够设置 mock
let syncService = null;
let syncToCloud = null;
let syncFromCloud = null;
let syncBidirectional = null;
let getLastSyncTime = null;
let SYNC_STATUS = null;

if (process.env.NODE_ENV === 'test') {
  syncService = require('../syncService');
  syncToCloud = syncService.syncToCloud;
  syncFromCloud = syncService.syncFromCloud;
  syncBidirectional = syncService.syncBidirectional;
  getLastSyncTime = syncService.getLastSyncTime;
  SYNC_STATUS = syncService.SYNC_STATUS;
}

describe('syncService', () => {
  beforeEach(() => {
    // 清除之前的mock
    if (process.env.NODE_ENV === 'test' && syncService) {
      syncService.clearMocks();
    }
  });

  describe('SYNC_STATUS 常量', () => {
    test('SYNC_STATUS constants are defined', () => {
      expect(SYNC_STATUS.IDLE).toBe('idle');
      expect(SYNC_STATUS.SYNCING).toBe('syncing');
      expect(SYNC_STATUS.SUCCESS).toBe('success');
      expect(SYNC_STATUS.ERROR).toBe('error');
      expect(SYNC_STATUS.CONFLICT).toBe('conflict');
    });

    test('SYNC_STATUS has all required statuses', () => {
      expect(Object.keys(SYNC_STATUS).length).toBe(5);
    });
  });

  describe('getLastSyncTime', () => {
    test('returns null when no sync time exists', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockResolvedValue({ rows: { length: 0 } }),
        });
      }

      const lastSyncTime = await getLastSyncTime();
      expect(lastSyncTime).toBeNull();
    });

    test('returns sync time when it exists', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockResolvedValue({
            rows: {
              length: 1,
              item: (index) => ({ value: '2024-01-15T10:30:00.000Z' }),
            },
          }),
        });
      }

      const lastSyncTime = await getLastSyncTime();
      expect(lastSyncTime).toBe('2024-01-15T10:30:00.000Z');
    });

    test('handles database errors', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockRejectedValue(new Error('Database error')),
        });
      }

      const lastSyncTime = await getLastSyncTime();
      expect(lastSyncTime).toBeNull();
    });
  });

  describe('syncToCloud', () => {
    test('succeeds with valid user', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockResolvedValue({}),
        });
      }

      const onProgress = jest.fn();
      const result = await syncToCloud(onProgress);

      expect(result.success).toBe(true);
      expect(result.message).toBe('同步到云端成功');
      expect(onProgress).toHaveBeenCalledWith(50, '正在同步到云端...');
      expect(onProgress).toHaveBeenCalledWith(100, '同步完成');
    });

    test('succeeds without progress callback', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockResolvedValue({}),
        });
      }

      const result = await syncToCloud();

      expect(result.success).toBe(true);
      expect(result.message).toBe('同步到云端成功');
    });

    test('throws error when user is not logged in', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock(null);
      }

      await expect(syncToCloud()).rejects.toThrow('用户未登录');
    });

    test('handles database errors', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockRejectedValue(new Error('Database error')),
        });
      }

      await expect(syncToCloud()).rejects.toThrow('Database error');
    });
  });

  describe('syncFromCloud', () => {
    test('succeeds with valid user', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockResolvedValue({}),
        });
      }

      const onProgress = jest.fn();
      const result = await syncFromCloud(onProgress);

      expect(result.success).toBe(true);
      expect(result.message).toBe('从云端同步成功');
      expect(onProgress).toHaveBeenCalledWith(50, '正在从云端同步...');
      expect(onProgress).toHaveBeenCalledWith(100, '同步完成');
    });

    test('succeeds without progress callback', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockResolvedValue({}),
        });
      }

      const result = await syncFromCloud();

      expect(result.success).toBe(true);
      expect(result.message).toBe('从云端同步成功');
    });

    test('throws error when user is not logged in', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock(null);
      }

      await expect(syncFromCloud()).rejects.toThrow('用户未登录');
    });

    test('handles database errors', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockRejectedValue(new Error('Database error')),
        });
      }

      await expect(syncFromCloud()).rejects.toThrow('Database error');
    });
  });

  describe('syncBidirectional', () => {
    test('succeeds with valid user', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockResolvedValue({}),
        });
      }

      const onProgress = jest.fn();
      const result = await syncBidirectional(onProgress);

      expect(result.success).toBe(true);
      expect(result.message).toBe('双向同步成功');
      expect(onProgress).toHaveBeenCalledWith(33, '正在准备双向同步...');
      expect(onProgress).toHaveBeenCalledWith(66, '正在同步数据...');
      expect(onProgress).toHaveBeenCalledWith(100, '同步完成');
    });

    test('succeeds without progress callback', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockResolvedValue({}),
        });
      }

      const result = await syncBidirectional();

      expect(result.success).toBe(true);
      expect(result.message).toBe('双向同步成功');
    });

    test('throws error when user is not logged in', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock(null);
      }

      await expect(syncBidirectional()).rejects.toThrow('用户未登录');
    });

    test('handles database errors', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockRejectedValue(new Error('Database error')),
        });
      }

      await expect(syncBidirectional()).rejects.toThrow('Database error');
    });
  });

  describe('Mock functions', () => {
    test('setDatabaseMock should be defined', () => {
      expect(syncService.setDatabaseMock).toBeDefined();
      expect(typeof syncService.setDatabaseMock).toBe('function');
    });

    test('setGetCurrentUserIdMock should be defined', () => {
      expect(syncService.setGetCurrentUserIdMock).toBeDefined();
      expect(typeof syncService.setGetCurrentUserIdMock).toBe('function');
    });

    test('clearMocks should be defined', () => {
      expect(syncService.clearMocks).toBeDefined();
      expect(typeof syncService.clearMocks).toBe('function');
    });

    test('clearMocks should clear all mocks', async () => {
      if (process.env.NODE_ENV === 'test' && syncService) {
        syncService.setGetCurrentUserIdMock('test-user-id');
        syncService.setDatabaseMock({
          executeSql: jest.fn().mockResolvedValue({}),
        });
        
        syncService.clearMocks();
        
        // After clearing, should use default behavior
        await expect(syncToCloud()).rejects.toThrow('用户未登录');
      }
    });
  });
});
