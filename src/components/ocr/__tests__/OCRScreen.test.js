// Simple test file for OCRScreen
// This test just verifies the component can be imported without errors

// Mock Expo modules before importing the component
jest.mock('@expo/vector-icons', () => {
  return {
    Ionicons: 'Ionicons'
  };
});

// Mock expo-camera module
jest.mock('expo-camera', () => {
  return {
    CameraView: 'CameraView',
    useCameraPermissions: () => [true, jest.fn()]
  };
});

// Mock expo-image-picker module
jest.mock('expo-image-picker', () => {
  return {
    launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
    launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
    requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true })
  };
});

// Mock expo-image-manipulator module
jest.mock('expo-image-manipulator', () => {
  return {
    manipulateAsync: jest.fn().mockResolvedValue({ uri: 'mock-uri' })
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
  Alert: {
    alert: jest.fn()
  },
  Image: 'Image',
  Modal: 'Modal'
}));

// Mock services
jest.mock('../../../services/ocrService', () => ({
  recognizeImage: jest.fn().mockResolvedValue('mock text'),
  extractTransactionInfo: jest.fn().mockResolvedValue({
    amount: 100,
    date: '2024-01-15',
    description: 'Test'
  })
}));

jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(() => ({ uid: 'test-user-id' }))
}));

jest.mock('../../../hooks/useCategories', () => ({
  useCategories: jest.fn(() => ({
    categories: [{ id: '1', name: 'Food', type: 'expense' }],
    expenseCategories: [{ id: '1', name: 'Food', type: 'expense' }]
  }))
}));

jest.mock('../../../hooks/useTransactions', () => ({
  useTransactions: jest.fn(() => ({
    createTransaction: jest.fn()
  }))
}));

describe('OCRScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('can be imported without errors', () => {
    expect(() => {
      require('../OCRScreen');
    }).not.toThrow();
  });

  test('should be defined', () => {
    const OCRScreen = require('../OCRScreen').default;
    expect(OCRScreen).toBeDefined();
  });

  test('should be a function', () => {
    const OCRScreen = require('../OCRScreen').default;
    expect(typeof OCRScreen).toBe('function');
  });

  test('should have correct mock setup for expo-camera', () => {
    const { useCameraPermissions } = require('expo-camera');
    const [hasPermission, requestPermission] = useCameraPermissions();
    
    expect(hasPermission).toBe(true);
    expect(typeof requestPermission).toBe('function');
  });

  test('should have correct mock setup for expo-image-picker', () => {
    const ImagePicker = require('expo-image-picker');
    
    expect(typeof ImagePicker.launchCameraAsync).toBe('function');
    expect(typeof ImagePicker.launchImageLibraryAsync).toBe('function');
    expect(typeof ImagePicker.requestMediaLibraryPermissionsAsync).toBe('function');
  });

  test('should have correct mock setup for expo-image-manipulator', () => {
    const ImageManipulator = require('expo-image-manipulator');
    
    expect(typeof ImageManipulator.manipulateAsync).toBe('function');
  });

  test('should have correct mock setup for ocrService', () => {
    const { recognizeImage, extractTransactionInfo } = require('../../../services/ocrService');
    
    expect(typeof recognizeImage).toBe('function');
    expect(typeof extractTransactionInfo).toBe('function');
  });

  test('should have correct mock setup for authService', () => {
    const { getCurrentUser } = require('../../../services/authService');
    const user = getCurrentUser();
    
    expect(user).toBeDefined();
    expect(user).toHaveProperty('uid');
  });

  test('should have correct mock setup for useCategories', () => {
    const { useCategories } = require('../../../hooks/useCategories');
    const result = useCategories();
    
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('expenseCategories');
    expect(Array.isArray(result.categories)).toBe(true);
  });

  test('should have correct mock setup for useTransactions', () => {
    const { useTransactions } = require('../../../hooks/useTransactions');
    const result = useTransactions();
    
    expect(result).toHaveProperty('createTransaction');
    expect(typeof result.createTransaction).toBe('function');
  });
});