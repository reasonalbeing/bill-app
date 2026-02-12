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

  test('SYNC_STATUS constants are defined', () => {
    expect(SYNC_STATUS.IDLE).toBe('idle');
    expect(SYNC_STATUS.SYNCING).toBe('syncing');
    expect(SYNC_STATUS.SUCCESS).toBe('success');
    expect(SYNC_STATUS.ERROR).toBe('error');
    expect(SYNC_STATUS.CONFLICT).toBe('conflict');
  });

  test('getLastSyncTime returns null when no sync time exists', async () => {
    // Mock database
    if (process.env.NODE_ENV === 'test' && syncService) {
      syncService.setDatabaseMock({
        executeSql: jest.fn().mockResolvedValue({ rows: { length: 0 } }),
      });
    }

    const lastSyncTime = await getLastSyncTime();
    expect(lastSyncTime).toBeNull();
  });

  test('syncToCloud succeeds with valid user', async () => {
    // Mock user ID
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

  test('syncFromCloud succeeds with valid user', async () => {
    // Mock user ID
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

  test('syncBidirectional succeeds with valid user', async () => {
    // Mock user ID
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

  test('syncToCloud throws error when user is not logged in', async () => {
    // Mock user ID as null
    if (process.env.NODE_ENV === 'test' && syncService) {
      syncService.setGetCurrentUserIdMock(null);
    }

    await expect(syncToCloud()).rejects.toThrow('用户未登录');
  });

  test('syncFromCloud throws error when user is not logged in', async () => {
    // Mock user ID as null
    if (process.env.NODE_ENV === 'test' && syncService) {
      syncService.setGetCurrentUserIdMock(null);
    }

    await expect(syncFromCloud()).rejects.toThrow('用户未登录');
  });

  test('syncBidirectional throws error when user is not logged in', async () => {
    // Mock user ID as null
    if (process.env.NODE_ENV === 'test' && syncService) {
      syncService.setGetCurrentUserIdMock(null);
    }

    await expect(syncBidirectional()).rejects.toThrow('用户未登录');
  });

  test('syncToCloud handles database errors', async () => {
    // Mock user ID and erroring database
    if (process.env.NODE_ENV === 'test' && syncService) {
      syncService.setGetCurrentUserIdMock('test-user-id');
      syncService.setDatabaseMock({
        executeSql: jest.fn().mockRejectedValue(new Error('Database error')),
      });
    }

    await expect(syncToCloud()).rejects.toThrow('Database error');
  });

  test('syncFromCloud handles database errors', async () => {
    // Mock user ID and erroring database
    if (process.env.NODE_ENV === 'test' && syncService) {
      syncService.setGetCurrentUserIdMock('test-user-id');
      syncService.setDatabaseMock({
        executeSql: jest.fn().mockRejectedValue(new Error('Database error')),
      });
    }

    await expect(syncFromCloud()).rejects.toThrow('Database error');
  });

  test('syncBidirectional handles database errors', async () => {
    // Mock user ID and erroring database
    if (process.env.NODE_ENV === 'test' && syncService) {
      syncService.setGetCurrentUserIdMock('test-user-id');
      syncService.setDatabaseMock({
        executeSql: jest.fn().mockRejectedValue(new Error('Database error')),
      });
    }

    await expect(syncBidirectional()).rejects.toThrow('Database error');
  });

  test('getLastSyncTime handles database errors', async () => {
    // Mock erroring database
    if (process.env.NODE_ENV === 'test' && syncService) {
      syncService.setDatabaseMock({
        executeSql: jest.fn().mockRejectedValue(new Error('Database error')),
      });
    }

    const lastSyncTime = await getLastSyncTime();
    expect(lastSyncTime).toBeNull();
  });
});