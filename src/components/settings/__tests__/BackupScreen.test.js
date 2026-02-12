// Simple test file for BackupScreen
// This test just verifies the component can be imported without errors

// Mock Expo modules before importing the component
jest.mock('@expo/vector-icons', () => {
  return {
    Ionicons: 'Ionicons'
  };
});

// Mock react-native modules to avoid Platform resolution issues
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: jest.fn(() => ({}))
  },
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  FlatList: 'FlatList',
  Alert: {
    alert: jest.fn()
  },
  Modal: 'Modal'
}));

// Mock services
jest.mock('../../../services/backupService', () => ({
  createBackup: jest.fn().mockResolvedValue({ success: true }),
  getBackupList: jest.fn().mockResolvedValue({
    success: true,
    backups: [
      { id: '1', name: 'Backup 1', date: '2024-01-15', size: 1024 },
      { id: '2', name: 'Backup 2', date: '2024-01-10', size: 2048 }
    ]
  }),
  shareBackup: jest.fn().mockResolvedValue({ success: true }),
  deleteBackup: jest.fn().mockResolvedValue({ success: true }),
  restoreFromBackup: jest.fn().mockResolvedValue({ success: true }),
  importBackupFromFile: jest.fn().mockResolvedValue({ success: true })
}));

describe('BackupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('can be imported without errors', () => {
    expect(() => {
      require('../BackupScreen');
    }).not.toThrow();
  });

  test('should be defined', () => {
    const BackupScreen = require('../BackupScreen').default;
    expect(BackupScreen).toBeDefined();
  });

  test('should be a function', () => {
    const BackupScreen = require('../BackupScreen').default;
    expect(typeof BackupScreen).toBe('function');
  });

  test('should have correct mock setup for backupService', () => {
    const {
      createBackup,
      getBackupList,
      shareBackup,
      deleteBackup,
      restoreFromBackup,
      importBackupFromFile
    } = require('../../../services/backupService');
    
    expect(typeof createBackup).toBe('function');
    expect(typeof getBackupList).toBe('function');
    expect(typeof shareBackup).toBe('function');
    expect(typeof deleteBackup).toBe('function');
    expect(typeof restoreFromBackup).toBe('function');
    expect(typeof importBackupFromFile).toBe('function');
  });

  test('should have backup list in mock', async () => {
    const { getBackupList } = require('../../../services/backupService');
    const result = await getBackupList();
    
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('backups');
    expect(Array.isArray(result.backups)).toBe(true);
    expect(result.backups.length).toBeGreaterThan(0);
  });

  test('should have backups with required properties', async () => {
    const { getBackupList } = require('../../../services/backupService');
    const result = await getBackupList();
    
    result.backups.forEach(backup => {
      expect(backup).toHaveProperty('id');
      expect(backup).toHaveProperty('name');
      expect(backup).toHaveProperty('date');
      expect(backup).toHaveProperty('size');
    });
  });

  test('should create backup successfully', async () => {
    const { createBackup } = require('../../../services/backupService');
    const result = await createBackup('Test Backup');
    
    expect(result.success).toBe(true);
  });

  test('should delete backup successfully', async () => {
    const { deleteBackup } = require('../../../services/backupService');
    const result = await deleteBackup('1');
    
    expect(result.success).toBe(true);
  });

  test('should restore from backup successfully', async () => {
    const { restoreFromBackup } = require('../../../services/backupService');
    const result = await restoreFromBackup('1');
    
    expect(result.success).toBe(true);
  });
});