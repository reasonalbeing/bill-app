import { syncToCloud, syncFromCloud, syncBidirectional, getLastSyncTime, SYNC_STATUS } from '../syncService';
import * as firebase from 'firebase/firestore';
import * as auth from 'firebase/auth';
import Database from '../../database/database';

// Mock dependencies
jest.mock('firebase/firestore');
jest.mock('firebase/auth');
jest.mock('../../database/database');
jest.mock('../../config/firebase', () => ({
  app: {},
}));

const mockGetFirestore = firebase.getFirestore;
const mockGetAuth = auth.getAuth;
const mockDatabase = Database;

describe('syncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth current user
    const mockAuth = {
      currentUser: {
        uid: 'test-user-id',
      },
    };
    mockGetAuth.mockReturnValue(mockAuth);
    
    // Mock Firestore
    const mockFirestore = {
      collection: jest.fn(),
      doc: jest.fn(),
      writeBatch: jest.fn(),
    };
    mockGetFirestore.mockReturnValue(mockFirestore);
    
    // Mock Database
    mockDatabase.executeSql.mockResolvedValue({
      rows: { length: 0, item: jest.fn() },
    });
  });

  describe('getLastSyncTime', () => {
    test('should get last sync time successfully', async () => {
      const mockResult = {
        rows: {
          length: 1,
          item: jest.fn().mockReturnValue({ value: '2024-01-01T00:00:00.000Z' }),
        },
      };
      mockDatabase.executeSql.mockResolvedValue(mockResult);
      
      const result = await getLastSyncTime();
      
      expect(result).toBe('2024-01-01T00:00:00.000Z');
      expect(mockDatabase.executeSql).toHaveBeenCalledWith(
        'SELECT value FROM settings WHERE key = ?',
        ['last_sync_time']
      );
    });

    test('should return null when no sync time exists', async () => {
      const mockResult = {
        rows: { length: 0 },
      };
      mockDatabase.executeSql.mockResolvedValue(mockResult);
      
      const result = await getLastSyncTime();
      
      expect(result).toBeNull();
    });

    test('should handle database error when getting last sync time', async () => {
      mockDatabase.executeSql.mockRejectedValue(new Error('Database error'));
      
      const result = await getLastSyncTime();
      
      expect(result).toBeNull();
    });
  });

  describe('syncToCloud', () => {
    test('should sync to cloud successfully', async () => {
      // Mock sync functions
      const mockSyncCategoriesToCloud = jest.fn().mockResolvedValue();
      const mockSyncTransactionsToCloud = jest.fn().mockResolvedValue();
      const mockSyncBudgetsToCloud = jest.fn().mockResolvedValue();
      const mockSaveLastSyncTime = jest.fn().mockResolvedValue('2024-01-01T00:00:00.000Z');
      
      // Spy on internal functions
      jest.spyOn(require('../syncService'), 'syncCategoriesToCloud').mockImplementation(mockSyncCategoriesToCloud);
      jest.spyOn(require('../syncService'), 'syncTransactionsToCloud').mockImplementation(mockSyncTransactionsToCloud);
      jest.spyOn(require('../syncService'), 'syncBudgetsToCloud').mockImplementation(mockSyncBudgetsToCloud);
      jest.spyOn(require('../syncService'), 'saveLastSyncTime').mockImplementation(mockSaveLastSyncTime);
      
      const onProgress = jest.fn();
      const result = await syncToCloud(onProgress);
      
      expect(result).toEqual({ success: true, message: '同步到云端成功' });
      expect(mockSyncCategoriesToCloud).toHaveBeenCalledWith('test-user-id', onProgress);
      expect(mockSyncTransactionsToCloud).toHaveBeenCalledWith('test-user-id', onProgress);
      expect(mockSyncBudgetsToCloud).toHaveBeenCalledWith('test-user-id', onProgress);
      expect(mockSaveLastSyncTime).toHaveBeenCalled();
    });

    test('should throw error when user not logged in', async () => {
      // Mock no current user
      const mockAuth = {
        currentUser: null,
      };
      mockGetAuth.mockReturnValue(mockAuth);
      
      await expect(syncToCloud()).rejects.toThrow('用户未登录');
    });

    test('should throw error when sync fails', async () => {
      // Mock sync function to throw error
      const mockSyncCategoriesToCloud = jest.fn().mockRejectedValue(new Error('Sync error'));
      jest.spyOn(require('../syncService'), 'syncCategoriesToCloud').mockImplementation(mockSyncCategoriesToCloud);
      
      await expect(syncToCloud()).rejects.toThrow('Sync error');
    });
  });

  describe('syncFromCloud', () => {
    test('should sync from cloud successfully', async () => {
      // Mock sync functions
      const mockSyncCategoriesFromCloud = jest.fn().mockResolvedValue();
      const mockSyncTransactionsFromCloud = jest.fn().mockResolvedValue();
      const mockSyncBudgetsFromCloud = jest.fn().mockResolvedValue();
      const mockSaveLastSyncTime = jest.fn().mockResolvedValue('2024-01-01T00:00:00.000Z');
      
      // Spy on internal functions
      jest.spyOn(require('../syncService'), 'syncCategoriesFromCloud').mockImplementation(mockSyncCategoriesFromCloud);
      jest.spyOn(require('../syncService'), 'syncTransactionsFromCloud').mockImplementation(mockSyncTransactionsFromCloud);
      jest.spyOn(require('../syncService'), 'syncBudgetsFromCloud').mockImplementation(mockSyncBudgetsFromCloud);
      jest.spyOn(require('../syncService'), 'saveLastSyncTime').mockImplementation(mockSaveLastSyncTime);
      
      const onProgress = jest.fn();
      const result = await syncFromCloud(onProgress);
      
      expect(result).toEqual({ success: true, message: '从云端同步成功' });
      expect(mockSyncCategoriesFromCloud).toHaveBeenCalledWith('test-user-id', onProgress);
      expect(mockSyncTransactionsFromCloud).toHaveBeenCalledWith('test-user-id', onProgress);
      expect(mockSyncBudgetsFromCloud).toHaveBeenCalledWith('test-user-id', onProgress);
      expect(mockSaveLastSyncTime).toHaveBeenCalled();
    });

    test('should throw error when user not logged in', async () => {
      // Mock no current user
      const mockAuth = {
        currentUser: null,
      };
      mockGetAuth.mockReturnValue(mockAuth);
      
      await expect(syncFromCloud()).rejects.toThrow('用户未登录');
    });

    test('should throw error when sync fails', async () => {
      // Mock sync function to throw error
      const mockSyncCategoriesFromCloud = jest.fn().mockRejectedValue(new Error('Sync error'));
      jest.spyOn(require('../syncService'), 'syncCategoriesFromCloud').mockImplementation(mockSyncCategoriesFromCloud);
      
      await expect(syncFromCloud()).rejects.toThrow('Sync error');
    });
  });

  describe('syncBidirectional', () => {
    test('should sync bidirectionally successfully', async () => {
      // Mock sync functions
      const mockSyncToCloud = jest.fn().mockResolvedValue({ success: true });
      const mockSyncFromCloud = jest.fn().mockResolvedValue({ success: true });
      
      // Spy on functions
      jest.spyOn(require('../syncService'), 'syncToCloud').mockImplementation(mockSyncToCloud);
      jest.spyOn(require('../syncService'), 'syncFromCloud').mockImplementation(mockSyncFromCloud);
      
      const onProgress = jest.fn();
      const result = await syncBidirectional(onProgress);
      
      expect(result).toEqual({ success: true, message: '双向同步成功' });
      expect(mockSyncToCloud).toHaveBeenCalledWith(onProgress);
      expect(mockSyncFromCloud).toHaveBeenCalledWith(onProgress);
    });

    test('should throw error when user not logged in', async () => {
      // Mock no current user
      const mockAuth = {
        currentUser: null,
      };
      mockGetAuth.mockReturnValue(mockAuth);
      
      await expect(syncBidirectional()).rejects.toThrow('用户未登录');
    });

    test('should throw error when sync fails', async () => {
      // Mock sync function to throw error
      const mockSyncToCloud = jest.fn().mockRejectedValue(new Error('Sync error'));
      jest.spyOn(require('../syncService'), 'syncToCloud').mockImplementation(mockSyncToCloud);
      
      await expect(syncBidirectional()).rejects.toThrow('Sync error');
    });
  });

  describe('SYNC_STATUS', () => {
    test('should have correct sync status values', () => {
      expect(SYNC_STATUS.IDLE).toBe('idle');
      expect(SYNC_STATUS.SYNCING).toBe('syncing');
      expect(SYNC_STATUS.SUCCESS).toBe('success');
      expect(SYNC_STATUS.ERROR).toBe('error');
      expect(SYNC_STATUS.CONFLICT).toBe('conflict');
    });
  });
});
