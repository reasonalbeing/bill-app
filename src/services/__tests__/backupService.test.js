import { initBackupDirectory, createBackup, getBackupList, shareBackup, deleteBackup, restoreFromBackup, importBackupFromFile, exportToCSV, autoBackup } from '../backupService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

// Mock dependencies
jest.mock('expo-file-system');
jest.mock('expo-sharing');
jest.mock('expo-document-picker');
jest.mock('../database/database', () => ({
  getDatabase: jest.fn(),
}));

const mockGetDatabase = require('../database/database').getDatabase;

describe('backupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock FileSystem constants
    FileSystem.documentDirectory = '/mock/document/';
    FileSystem.cacheDirectory = '/mock/cache/';
    
    // Mock default FileSystem responses
    FileSystem.getInfoAsync.mockResolvedValue({ exists: false });
    FileSystem.makeDirectoryAsync.mockResolvedValue();
  });

  describe('initBackupDirectory', () => {
    test('should create backup directory when it does not exist', async () => {
      FileSystem.getInfoAsync.mockResolvedValue({ exists: false });
      FileSystem.makeDirectoryAsync.mockResolvedValue();
      
      const result = await initBackupDirectory();
      
      expect(result).toEqual({ success: true });
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('/mock/document/backups/');
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith('/mock/document/backups/', { intermediates: true });
    });

    test('should do nothing when backup directory already exists', async () => {
      FileSystem.getInfoAsync.mockResolvedValue({ exists: true });
      
      const result = await initBackupDirectory();
      
      expect(result).toEqual({ success: true });
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('/mock/document/backups/');
      expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });

    test('should handle errors when initializing backup directory', async () => {
      FileSystem.getInfoAsync.mockRejectedValue(new Error('FileSystem error'));
      
      const result = await initBackupDirectory();
      
      expect(result).toEqual({ success: false, error: 'FileSystem error' });
    });
  });

  describe('createBackup', () => {
    test('should create backup successfully', async () => {
      // Mock database
      const mockDB = {
        getAllAsync: jest.fn(),
      };
      mockGetDatabase.mockResolvedValue(mockDB);
      mockDB.getAllAsync.mockResolvedValue([]);
      
      // Mock FileSystem
      FileSystem.writeAsStringAsync.mockResolvedValue();
      
      const result = await createBackup('test_backup');
      
      expect(result.success).toBe(true);
      expect(result.fileName).toBe('test_backup.json');
      expect(result.filePath).toContain('/mock/document/backups/test_backup.json');
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    test('should create backup with auto-generated name when no name provided', async () => {
      // Mock database
      const mockDB = {
        getAllAsync: jest.fn(),
      };
      mockGetDatabase.mockResolvedValue(mockDB);
      mockDB.getAllAsync.mockResolvedValue([]);
      
      // Mock FileSystem
      FileSystem.writeAsStringAsync.mockResolvedValue();
      
      const result = await createBackup();
      
      expect(result.success).toBe(true);
      expect(result.fileName).toMatch(/^backup_.*\.json$/);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    test('should handle database errors when creating backup', async () => {
      // Mock database error
      const mockDB = {
        getAllAsync: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      mockGetDatabase.mockResolvedValue(mockDB);
      
      const result = await createBackup();
      
      expect(result).toEqual({ success: false, error: 'Database error' });
    });
  });

  describe('getBackupList', () => {
    test('should get backup list successfully', async () => {
      // Mock backup files
      FileSystem.readDirectoryAsync.mockResolvedValue(['backup1.json', 'backup2.json']);
      
      // Mock file info
      FileSystem.getInfoAsync.mockResolvedValue({ size: 1024, modificationTime: '2024-01-01T00:00:00Z' });
      
      // Mock file content
      FileSystem.readAsStringAsync.mockResolvedValue(
        JSON.stringify({
          version: '1.0',
          timestamp: '2024-01-01T00:00:00Z',
          data: { transactions: [] }
        })
      );
      
      const result = await getBackupList();
      
      expect(result.success).toBe(true);
      expect(result.backups).toHaveLength(2);
      expect(result.backups[0]).toHaveProperty('fileName');
      expect(result.backups[0]).toHaveProperty('filePath');
      expect(result.backups[0]).toHaveProperty('size', 1024);
      expect(result.backups[0]).toHaveProperty('timestamp', '2024-01-01T00:00:00Z');
      expect(result.backups[0]).toHaveProperty('version', '1.0');
    });

    test('should handle invalid backup files', async () => {
      // Mock backup files
      FileSystem.readDirectoryAsync.mockResolvedValue(['invalid_backup.json']);
      
      // Mock file info
      FileSystem.getInfoAsync.mockResolvedValue({ size: 512, modificationTime: '2024-01-01T00:00:00Z' });
      
      // Mock file read error
      FileSystem.readAsStringAsync.mockRejectedValue(new Error('File read error'));
      
      const result = await getBackupList();
      
      expect(result.success).toBe(true);
      expect(result.backups).toHaveLength(1);
      expect(result.backups[0]).toHaveProperty('isInvalid', true);
      expect(result.backups[0]).toHaveProperty('version', 'invalid');
    });

    test('should return empty list when no backup files exist', async () => {
      FileSystem.readDirectoryAsync.mockResolvedValue([]);
      
      const result = await getBackupList();
      
      expect(result.success).toBe(true);
      expect(result.backups).toEqual([]);
    });
  });

  describe('shareBackup', () => {
    test('should share backup file successfully', async () => {
      const filePath = '/mock/backup/file.json';
      
      Sharing.isAvailableAsync.mockResolvedValue(true);
      Sharing.shareAsync.mockResolvedValue();
      
      const result = await shareBackup(filePath);
      
      expect(result).toEqual({ success: true });
      expect(Sharing.isAvailableAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalledWith(filePath, {
        mimeType: 'application/json',
        dialogTitle: '分享备份文件',
      });
    });

    test('should handle sharing not available', async () => {
      const filePath = '/mock/backup/file.json';
      
      Sharing.isAvailableAsync.mockResolvedValue(false);
      
      const result = await shareBackup(filePath);
      
      expect(result).toEqual({ success: false, error: '分享功能不可用' });
    });

    test('should handle sharing errors', async () => {
      const filePath = '/mock/backup/file.json';
      
      Sharing.isAvailableAsync.mockResolvedValue(true);
      Sharing.shareAsync.mockRejectedValue(new Error('Sharing error'));
      
      const result = await shareBackup(filePath);
      
      expect(result).toEqual({ success: false, error: 'Sharing error' });
    });
  });

  describe('deleteBackup', () => {
    test('should delete backup file successfully', async () => {
      const filePath = '/mock/backup/file.json';
      
      FileSystem.deleteAsync.mockResolvedValue();
      
      const result = await deleteBackup(filePath);
      
      expect(result).toEqual({ success: true });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(filePath);
    });

    test('should handle delete errors', async () => {
      const filePath = '/mock/backup/file.json';
      
      FileSystem.deleteAsync.mockRejectedValue(new Error('Delete error'));
      
      const result = await deleteBackup(filePath);
      
      expect(result).toEqual({ success: false, error: 'Delete error' });
    });
  });

  describe('restoreFromBackup', () => {
    test('should restore backup successfully', async () => {
      const filePath = '/mock/backup/file.json';
      const backupContent = JSON.stringify({
        version: '1.0',
        timestamp: '2024-01-01T00:00:00Z',
        data: {
          categories: [{ id: 1, name: '餐饮', type: 'expense' }],
          transactions: [{ id: 1, amount: 100, type: 'expense' }],
          budgets: [{ id: 1, amount: 1000 }],
          ai_rules: [],
        }
      });
      
      // Mock file read
      FileSystem.readAsStringAsync.mockResolvedValue(backupContent);
      
      // Mock database
      const mockDB = {
        execAsync: jest.fn(),
        runAsync: jest.fn(),
        getAllAsync: jest.fn(),
      };
      mockGetDatabase.mockResolvedValue(mockDB);
      
      const result = await restoreFromBackup(filePath);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('数据恢复成功');
      expect(mockDB.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockDB.execAsync).toHaveBeenCalledWith('DELETE FROM transactions');
      expect(mockDB.execAsync).toHaveBeenCalledWith('DELETE FROM categories');
      expect(mockDB.execAsync).toHaveBeenCalledWith('DELETE FROM budgets');
      expect(mockDB.execAsync).toHaveBeenCalledWith('DELETE FROM ai_rules');
      expect(mockDB.execAsync).toHaveBeenCalledWith('COMMIT');
    });

    test('should handle invalid backup file format', async () => {
      const filePath = '/mock/backup/file.json';
      const invalidContent = JSON.stringify({ version: '1.0' }); // Missing data
      
      FileSystem.readAsStringAsync.mockResolvedValue(invalidContent);
      
      const result = await restoreFromBackup(filePath);
      
      expect(result).toEqual({ success: false, error: '无效的备份文件格式' });
    });

    test('should rollback transaction on error', async () => {
      const filePath = '/mock/backup/file.json';
      const backupContent = JSON.stringify({
        version: '1.0',
        timestamp: '2024-01-01T00:00:00Z',
        data: { categories: [{ id: 1, name: '餐饮' }] }
      });
      
      // Mock file read
      FileSystem.readAsStringAsync.mockResolvedValue(backupContent);
      
      // Mock database with error
      const mockDB = {
        execAsync: jest.fn(),
        runAsync: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      mockGetDatabase.mockResolvedValue(mockDB);
      
      const result = await restoreFromBackup(filePath);
      
      expect(result).toEqual({ success: false, error: 'Database error' });
      expect(mockDB.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockDB.execAsync).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('importBackupFromFile', () => {
    test('should import backup from file successfully', async () => {
      const mockFile = {
        uri: '/mock/temp/backup.json',
        name: 'backup.json',
      };
      
      // Mock DocumentPicker
      DocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [mockFile],
      });
      
      // Mock file read
      const backupContent = JSON.stringify({
        version: '1.0',
        timestamp: '2024-01-01T00:00:00Z',
        data: { transactions: [] }
      });
      FileSystem.readAsStringAsync.mockResolvedValue(backupContent);
      
      // Mock file copy
      FileSystem.copyAsync.mockResolvedValue();
      
      const result = await importBackupFromFile();
      
      expect(result.success).toBe(true);
      expect(result.filePath).toMatch(/^\/mock\/document\/backups\/imported_.*\.json$/);
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
    });

    test('should handle document picker canceled', async () => {
      DocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: true,
      });
      
      const result = await importBackupFromFile();
      
      expect(result).toEqual({ success: false, canceled: true });
    });

    test('should handle invalid backup file', async () => {
      const mockFile = {
        uri: '/mock/temp/backup.json',
      };
      
      // Mock DocumentPicker
      DocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [mockFile],
      });
      
      // Mock invalid file
      const invalidContent = JSON.stringify({ version: '1.0' }); // Missing data
      FileSystem.readAsStringAsync.mockResolvedValue(invalidContent);
      
      const result = await importBackupFromFile();
      
      expect(result).toEqual({ success: false, error: '无效的备份文件' });
    });
  });

  describe('exportToCSV', () => {
    test('should export to CSV successfully', async () => {
      const transactions = [
        {
          date: '2024-01-01',
          amount: 100,
          type: 'expense',
          category_name: '餐饮',
          description: '午餐',
          payment_method: '支付宝',
          platform: '美团',
        },
      ];
      
      // Mock sharing
      Sharing.isAvailableAsync.mockResolvedValue(true);
      Sharing.shareAsync.mockResolvedValue();
      
      // Mock file write
      FileSystem.writeAsStringAsync.mockResolvedValue();
      
      const result = await exportToCSV(transactions);
      
      expect(result.success).toBe(true);
      expect(result.fileName).toMatch(/^账单导出_.*\.csv$/);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });

    test('should handle empty transactions', async () => {
      const result = await exportToCSV([]);
      
      expect(result).toEqual({ success: false, error: '没有可导出的数据' });
    });

    test('should handle sharing not available', async () => {
      const transactions = [{ date: '2024-01-01', amount: 100, type: 'expense' }];
      
      Sharing.isAvailableAsync.mockResolvedValue(false);
      FileSystem.writeAsStringAsync.mockResolvedValue();
      
      const result = await exportToCSV(transactions);
      
      expect(result.success).toBe(true);
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });
  });

  describe('autoBackup', () => {
    test('should create auto backup when needed', async () => {
      // Mock getBackupList to return old backup
      const oldBackup = {
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      };
      
      // Mock getBackupList
      const mockGetBackupList = jest.spyOn(require('../backupService'), 'getBackupList');
      mockGetBackupList.mockResolvedValue({ success: true, backups: [oldBackup] });
      
      // Mock createBackup
      const mockCreateBackup = jest.spyOn(require('../backupService'), 'createBackup');
      mockCreateBackup.mockResolvedValue({ success: true, fileName: 'auto_backup.json' });
      
      const result = await autoBackup();
      
      expect(result.success).toBe(true);
      expect(mockCreateBackup).toHaveBeenCalledWith('auto_backup');
      
      mockGetBackupList.mockRestore();
      mockCreateBackup.mockRestore();
    });

    test('should skip auto backup when recent backup exists', async () => {
      // Mock getBackupList to return recent backup
      const recentBackup = {
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      };
      
      // Mock getBackupList
      const mockGetBackupList = jest.spyOn(require('../backupService'), 'getBackupList');
      mockGetBackupList.mockResolvedValue({ success: true, backups: [recentBackup] });
      
      // Mock createBackup
      const mockCreateBackup = jest.spyOn(require('../backupService'), 'createBackup');
      
      const result = await autoBackup();
      
      expect(result).toEqual({ success: true, skipped: true, reason: '距离上次备份不足7天' });
      expect(mockCreateBackup).not.toHaveBeenCalled();
      
      mockGetBackupList.mockRestore();
      mockCreateBackup.mockRestore();
    });

    test('should create auto backup when no backups exist', async () => {
      // Mock getBackupList to return empty list
      const mockGetBackupList = jest.spyOn(require('../backupService'), 'getBackupList');
      mockGetBackupList.mockResolvedValue({ success: true, backups: [] });
      
      // Mock createBackup
      const mockCreateBackup = jest.spyOn(require('../backupService'), 'createBackup');
      mockCreateBackup.mockResolvedValue({ success: true, fileName: 'auto_backup.json' });
      
      const result = await autoBackup();
      
      expect(result.success).toBe(true);
      expect(mockCreateBackup).toHaveBeenCalledWith('auto_backup');
      
      mockGetBackupList.mockRestore();
      mockCreateBackup.mockRestore();
    });
  });
});
