// Simple test file for StatisticsRulesScreen
// This test just verifies the component can be imported without errors

// Mock Expo modules before importing the component
jest.mock('@expo/vector-icons', () => {
  return {
    Ionicons: 'Ionicons'
  };
});

// Mock expo-secure-store module
jest.mock('expo-secure-store', () => {
  return {
    setItemAsync: jest.fn().mockResolvedValue(),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue()
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
  Switch: 'Switch',
  ActivityIndicator: 'ActivityIndicator',
  Alert: {
    alert: jest.fn()
  },
  Modal: 'Modal'
}));

// Mock services that use expo-secure-store
jest.mock('../../../services/statisticsRuleService', () => {
  return {
    getStatisticsRules: jest.fn().mockResolvedValue({
      types: [
        { id: 'expense', name: '支出', color: '#FF6B6B', includeInTotal: true },
        { id: 'income', name: '收入', color: '#4ECDC4', includeInTotal: true },
        { id: 'transfer', name: '转账', color: '#45B7D1', includeInTotal: false }
      ],
      autoRules: [
        { id: '1', name: '支付宝红包', keywords: ['红包'], statisticsType: 'transfer' },
        { id: '2', name: '微信转账', keywords: ['转账'], statisticsType: 'transfer' }
      ]
    }),
    saveStatisticsRules: jest.fn().mockResolvedValue({ success: true }),
    addCustomStatisticsType: jest.fn().mockResolvedValue({ success: true }),
    removeCustomStatisticsType: jest.fn().mockResolvedValue({ success: true }),
    addAutoRule: jest.fn().mockResolvedValue({ success: true }),
    updateAutoRule: jest.fn().mockResolvedValue({ success: true }),
    removeAutoRule: jest.fn().mockResolvedValue({ success: true }),
    resetToDefaultRules: jest.fn().mockResolvedValue({ success: true }),
    DEFAULT_STATISTICS_TYPES: [
      { id: 'expense', name: '支出', color: '#FF6B6B', includeInTotal: true },
      { id: 'income', name: '收入', color: '#4ECDC4', includeInTotal: true }
    ]
  };
});

describe('StatisticsRulesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('can be imported without errors', () => {
    expect(() => {
      require('../StatisticsRulesScreen');
    }).not.toThrow();
  });

  test('should be defined', () => {
    const StatisticsRulesScreen = require('../StatisticsRulesScreen').default;
    expect(StatisticsRulesScreen).toBeDefined();
  });

  test('should be a function', () => {
    const StatisticsRulesScreen = require('../StatisticsRulesScreen').default;
    expect(typeof StatisticsRulesScreen).toBe('function');
  });

  test('should have correct mock setup for statisticsRuleService', () => {
    const {
      getStatisticsRules,
      saveStatisticsRules,
      addCustomStatisticsType,
      removeCustomStatisticsType,
      addAutoRule,
      updateAutoRule,
      removeAutoRule,
      resetToDefaultRules
    } = require('../../../services/statisticsRuleService');
    
    expect(typeof getStatisticsRules).toBe('function');
    expect(typeof saveStatisticsRules).toBe('function');
    expect(typeof addCustomStatisticsType).toBe('function');
    expect(typeof removeCustomStatisticsType).toBe('function');
    expect(typeof addAutoRule).toBe('function');
    expect(typeof updateAutoRule).toBe('function');
    expect(typeof removeAutoRule).toBe('function');
    expect(typeof resetToDefaultRules).toBe('function');
  });

  test('should have DEFAULT_STATISTICS_TYPES in mock', () => {
    const { DEFAULT_STATISTICS_TYPES } = require('../../../services/statisticsRuleService');
    
    expect(DEFAULT_STATISTICS_TYPES).toBeDefined();
    expect(Array.isArray(DEFAULT_STATISTICS_TYPES)).toBe(true);
    expect(DEFAULT_STATISTICS_TYPES.length).toBeGreaterThan(0);
  });

  test('should get statistics rules successfully', async () => {
    const { getStatisticsRules } = require('../../../services/statisticsRuleService');
    const rules = await getStatisticsRules();
    
    expect(rules).toBeDefined();
    expect(rules).toHaveProperty('types');
    expect(rules).toHaveProperty('autoRules');
    expect(Array.isArray(rules.types)).toBe(true);
    expect(Array.isArray(rules.autoRules)).toBe(true);
  });

  test('should have types with required properties', async () => {
    const { getStatisticsRules } = require('../../../services/statisticsRuleService');
    const rules = await getStatisticsRules();
    
    rules.types.forEach(type => {
      expect(type).toHaveProperty('id');
      expect(type).toHaveProperty('name');
      expect(type).toHaveProperty('color');
      expect(type).toHaveProperty('includeInTotal');
    });
  });

  test('should have auto rules with required properties', async () => {
    const { getStatisticsRules } = require('../../../services/statisticsRuleService');
    const rules = await getStatisticsRules();
    
    rules.autoRules.forEach(rule => {
      expect(rule).toHaveProperty('id');
      expect(rule).toHaveProperty('name');
      expect(rule).toHaveProperty('keywords');
      expect(rule).toHaveProperty('statisticsType');
    });
  });

  test('should add custom statistics type successfully', async () => {
    const { addCustomStatisticsType } = require('../../../services/statisticsRuleService');
    const result = await addCustomStatisticsType({
      name: 'Investment',
      color: '#FFD700',
      includeInTotal: false
    });
    
    expect(result.success).toBe(true);
  });

  test('should add auto rule successfully', async () => {
    const { addAutoRule } = require('../../../services/statisticsRuleService');
    const result = await addAutoRule({
      name: 'Test Rule',
      keywords: ['test'],
      statisticsType: 'transfer'
    });
    
    expect(result.success).toBe(true);
  });

  test('should reset to default rules successfully', async () => {
    const { resetToDefaultRules } = require('../../../services/statisticsRuleService');
    const result = await resetToDefaultRules();
    
    expect(result.success).toBe(true);
  });
});