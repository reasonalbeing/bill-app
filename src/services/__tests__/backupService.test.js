// Test backupService file structure and basic functionality

// Mock expo-file-system before any imports
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/directory/',
  cacheDirectory: '/mock/cache/directory/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8'
  }
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn()
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn()
}));

// Mock react-native components
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  },
  Alert: {
    alert: jest.fn()
  }
}));

// Mock database
jest.mock('../../config/database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
    execAsync: jest.fn()
  })
}));

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';
import { getDatabase } from '../../config/database';
import {
  initBackupDirectory,
  createBackup,
  getBackupList,
  shareBackup,
  deleteBackup,
  restoreFromBackup,
  importBackupFromFile,
  exportToCSV,
  autoBackup,
} from '../backupService';

describe('backupService', () => {
  const mockFileSystem = FileSystem;
  const mockSharing = Sharing;
  const mockDocumentPicker = DocumentPicker;
  const mockGetDatabase = getDatabase;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock default implementations
    mockFileSystem.getInfoAsync.mockResolvedValue({ exists: false });
    mockFileSystem.makeDirectoryAsync.mockResolvedValue();
    mockFileSystem.writeAsStringAsync.mockResolvedValue();
    mockFileSystem.readDirectoryAsync.mockResolvedValue([]);
    mockFileSystem.readAsStringAsync.mockResolvedValue('{}');
    mockFileSystem.deleteAsync.mockResolvedValue();
    mockFileSystem.copyAsync.mockResolvedValue();
    mockSharing.isAvailableAsync.mockResolvedValue(true);
    mockSharing.shareAsync.mockResolvedValue();
    mockDocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: true });

    // Mock database
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([]),
      runAsync: jest.fn().mockResolvedValue(),
      execAsync: jest.fn().mockResolvedValue()
    };
    mockGetDatabase.mockResolvedValue(mockDb);
  });

  describe('initBackupDirectory', () => {
    test('should create directory when it does not exist', async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({ exists: false });

      const result = await initBackupDirectory();

      expect(result.success).toBe(true);
      expect(mockFileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        '/mock/document/directory/backups/',
        { intermediates: true }
      );
    });

    test('should not create directory when it exists', async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({ exists: true });

      const result = await initBackupDirectory();

      expect(result.success).toBe(true);
      expect(mockFileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });

    test('should handle error when creating directory', async () => {
      mockFileSystem.getInfoAsync.mockRejectedValue(new Error('IO error'));

      const result = await initBackupDirectory();

      expect(result.success).toBe(false);
      expect(result.error).toBe('IO error');
    });
  });

  describe('createBackup', () => {
    test('should create backup successfully with default name', async () => {
      // Mock database response
      const mockDb = {
        getAllAsync: jest.fn().mockResolvedValue([])
      };
      mockGetDatabase.mockResolvedValue(mockDb);

      const result = await createBackup();

      expect(result.success).toBe(true);
      expect(result.filePath).toMatch(/\/mock\/document\/directory\/backups\/backup_.*\.json$/);
      expect(mockFileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    test('should create backup successfully with custom name', async () => {
      // Mock database response
      const mockDb = {
        getAllAsync: jest.fn().mockResolvedValue([])
      };
      mockGetDatabase.mockResolvedValue(mockDb);

      const result = await createBackup('my_backup');

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/mock/document/directory/backups/my_backup.json');
      expect(result.fileName).toBe('my_backup.json');
    });

    test('should handle error when creating backup', async () => {
      mockFileSystem.writeAsStringAsync.mockRejectedValue(new Error('Write error'));

      const result = await createBackup();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Write error');
    });
  });

  describe('getBackupList', () => {
    test('should return empty backup list when no files exist', async () => {
      mockFileSystem.readDirectoryAsync.mockResolvedValue([]);

      const result = await getBackupList();

      expect(result.success).toBe(true);
      expect(result.backups).toEqual([]);
    });

    test('should return backup list with valid files', async () => {
      const mockFiles = ['backup_1.json', 'backup_2.json'];
      const mockFileContent = JSON.stringify({
        version: '1.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        data: {}
      });

      mockFileSystem.readDirectoryAsync.mockResolvedValue(mockFiles);
      mockFileSystem.getInfoAsync.mockResolvedValue({ size: 1000 });
      mockFileSystem.readAsStringAsync.mockResolvedValue(mockFileContent);

      const result = await getBackupList();

      expect(result.success).toBe(true);
      expect(result.backups.length).toBe(2);
      expect(result.backups[0].fileName).toBe('backup_1.json');
    });

    test('should handle invalid backup files', async () => {
      const mockFiles = ['invalid_backup.json'];

      mockFileSystem.readDirectoryAsync.mockResolvedValue(mockFiles);
      mockFileSystem.getInfoAsync.mockResolvedValue({ size: 100, modificationTime: '2024-01-01T00:00:00.000Z' });
      mockFileSystem.readAsStringAsync.mockRejectedValue(new Error('Parse error'));

      const result = await getBackupList();

      expect(result.success).toBe(true);
      expect(result.backups[0].isInvalid).toBe(true);
      expect(result.backups[0].version).toBe('invalid');
    });

    test('should handle error when getting backup list', async () => {
      mockFileSystem.readDirectoryAsync.mockRejectedValue(new Error('IO error'));

      const result = await getBackupList();

      expect(result.success).toBe(false);
      expect(result.error).toBe('IO error');
      expect(result.backups).toEqual([]);
    });
  });

  describe('shareBackup', () => {
    test('should share backup successfully', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(true);

      const result = await shareBackup('/mock/path/backup.json');

      expect(result.success).toBe(true);
      expect(mockSharing.shareAsync).toHaveBeenCalledWith(
        '/mock/path/backup.json',
        {
          mimeType: 'application/json',
          dialogTitle: '分享备份文件'
        }
      );
    });

    test('should handle sharing not available', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(false);

      const result = await shareBackup('/mock/path/backup.json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('分享功能不可用');
    });

    test('should handle error when sharing', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(true);
      mockSharing.shareAsync.mockRejectedValue(new Error('Share error'));

      const result = await shareBackup('/mock/path/backup.json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Share error');
    });
  });

  describe('deleteBackup', () => {
    test('should delete backup successfully', async () => {
      const result = await deleteBackup('/mock/path/backup.json');

      expect(result.success).toBe(true);
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith('/mock/path/backup.json');
    });

    test('should handle error when deleting backup', async () => {
      mockFileSystem.deleteAsync.mockRejectedValue(new Error('Delete error'));

      const result = await deleteBackup('/mock/path/backup.json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete error');
    });
  });

  describe('restoreFromBackup', () => {
    test('should restore backup successfully', async () => {
      const mockBackupContent = JSON.stringify({
        version: '1.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        data: {
          categories: [],
          transactions: [],
          budgets: []
        }
      });

      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBackupContent);

      const result = await restoreFromBackup('/mock/path/backup.json');

      expect(result.success).toBe(true);
      expect(result.message).toBe('数据恢复成功');
    });

    test('should handle invalid backup file format', async () => {
      const mockBackupContent = JSON.stringify({});

      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBackupContent);

      const result = await restoreFromBackup('/mock/path/backup.json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的备份文件格式');
    });

    test('should handle error when restoring backup', async () => {
      mockFileSystem.readAsStringAsync.mockRejectedValue(new Error('Read error'));

      const result = await restoreFromBackup('/mock/path/backup.json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Read error');
    });
  });

  describe('importBackupFromFile', () => {
    test('should import backup successfully', async () => {
      const mockFileUri = '/mock/picked/file.json';
      const mockBackupContent = JSON.stringify({
        version: '1.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        data: {}
      });

      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockFileUri }]
      });
      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBackupContent);

      const result = await importBackupFromFile();

      expect(result.success).toBe(true);
      expect(result.filePath).toMatch(/\/mock\/document\/directory\/backups\/imported_.*\.json$/);
    });

    test('should handle canceled document picker', async () => {
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: true });

      const result = await importBackupFromFile();

      expect(result.success).toBe(false);
      expect(result.canceled).toBe(true);
    });

    test('should handle invalid backup file', async () => {
      const mockFileUri = '/mock/picked/file.json';
      const mockBackupContent = JSON.stringify({});

      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockFileUri }]
      });
      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBackupContent);

      const result = await importBackupFromFile();

      expect(result.success).toBe(false);
      expect(result.error).toBe('无效的备份文件');
    });

    test('should handle error when importing backup', async () => {
      mockDocumentPicker.getDocumentAsync.mockRejectedValue(new Error('Picker error'));

      const result = await importBackupFromFile();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Picker error');
    });
  });

  describe('exportToCSV', () => {
    test('should export to CSV successfully', async () => {
      const mockTransactions = [
        {
          date: '2024-01-01',
          type: 'expense',
          amount: 100,
          category_name: '餐饮',
          description: '午餐',
          payment_method: '微信支付',
          platform: 'wechat'
        }
      ];

      mockSharing.isAvailableAsync.mockResolvedValue(true);

      const result = await exportToCSV(mockTransactions);

      expect(result.success).toBe(true);
      expect(result.filePath).toMatch(/\/mock\/cache\/directory\/账单导出_.*\.csv$/);
      expect(mockSharing.shareAsync).toHaveBeenCalled();
    });

    test('should handle empty transactions', async () => {
      const result = await exportToCSV([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('没有可导出的数据');
    });

    test('should handle sharing not available', async () => {
      const mockTransactions = [
        {
          date: '2024-01-01',
          type: 'expense',
          amount: 100
        }
      ];

      mockSharing.isAvailableAsync.mockResolvedValue(false);

      const result = await exportToCSV(mockTransactions);

      expect(result.success).toBe(true);
      expect(mockSharing.shareAsync).not.toHaveBeenCalled();
    });

    test('should handle error when exporting', async () => {
      const mockTransactions = [
        {
          date: '2024-01-01',
          type: 'expense',
          amount: 100
        }
      ];

      mockFileSystem.writeAsStringAsync.mockRejectedValue(new Error('Write error'));

      const result = await exportToCSV(mockTransactions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Write error');
    });
  });

  describe('autoBackup', () => {
    test('should create auto backup when no previous backup exists', async () => {
      // Mock the file system to simulate no backup files
      mockFileSystem.readDirectoryAsync.mockResolvedValue([]);
      mockFileSystem.writeAsStringAsync.mockResolvedValue();

      const result = await autoBackup();

      expect(result.success).toBe(true);
    });

    test('should create auto backup when getBackupList fails', async () => {
      // Mock getBackupList to return error
      const mockGetBackupList = jest.fn().mockResolvedValue({ success: false, error: 'IO error', backups: [] });
      
      // Use spyOn to mock the function
      jest.spyOn(require('../backupService'), 'getBackupList').mockImplementation(mockGetBackupList);
      mockFileSystem.writeAsStringAsync.mockResolvedValue();

      const result = await autoBackup();

      expect(result.success).toBe(true);

      // Restore original function
      jest.restoreAllMocks();
    });
  });

  describe('Module exports', () => {
    test('should export all required functions', () => {
      expect(typeof initBackupDirectory).toBe('function');
      expect(typeof createBackup).toBe('function');
      expect(typeof getBackupList).toBe('function');
      expect(typeof shareBackup).toBe('function');
      expect(typeof deleteBackup).toBe('function');
      expect(typeof restoreFromBackup).toBe('function');
      expect(typeof importBackupFromFile).toBe('function');
      expect(typeof exportToCSV).toBe('function');
      expect(typeof autoBackup).toBe('function');
    });
  });
});
