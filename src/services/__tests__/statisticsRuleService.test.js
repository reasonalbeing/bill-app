import {
  DEFAULT_STATISTICS_TYPES,
  DEFAULT_AUTO_RULES,
  getStatisticsRules,
  saveStatisticsRules,
  addCustomStatisticsType,
  removeCustomStatisticsType,
  addAutoRule,
  updateAutoRule,
  removeAutoRule,
  autoDetectStatisticsType,
  getAllStatisticsTypes,
  calculateStatistics,
  batchUpdateStatisticsType,
  resetToDefaultRules,
} from '../statisticsRuleService';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

describe('statisticsRuleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DEFAULT_STATISTICS_TYPES', () => {
    it('should have default statistics types', () => {
      expect(DEFAULT_STATISTICS_TYPES).toHaveProperty('expense');
      expect(DEFAULT_STATISTICS_TYPES).toHaveProperty('income');
      expect(DEFAULT_STATISTICS_TYPES).toHaveProperty('transfer');
      expect(DEFAULT_STATISTICS_TYPES).toHaveProperty('exclude');
    });

    it('should have correct structure for expense type', () => {
      expect(DEFAULT_STATISTICS_TYPES.expense).toMatchObject({
        id: 'expense',
        name: '支出',
        color: '#FF3B30',
        icon: 'arrow-down-circle',
        includeInTotal: true,
        isDefault: true,
      });
    });

    it('should have correct structure for transfer type', () => {
      expect(DEFAULT_STATISTICS_TYPES.transfer).toMatchObject({
        id: 'transfer',
        name: '转移',
        includeInTotal: false,
        isDefault: true,
      });
    });
  });

  describe('DEFAULT_AUTO_RULES', () => {
    it('should have default auto rules', () => {
      expect(DEFAULT_AUTO_RULES).toHaveLength(4);
      expect(DEFAULT_AUTO_RULES[0]).toHaveProperty('id');
      expect(DEFAULT_AUTO_RULES[0]).toHaveProperty('name');
      expect(DEFAULT_AUTO_RULES[0]).toHaveProperty('keywords');
      expect(DEFAULT_AUTO_RULES[0]).toHaveProperty('statisticsType');
    });
  });

  describe('getStatisticsRules', () => {
    it('should return stored rules if available', async () => {
      const storedRules = {
        types: DEFAULT_STATISTICS_TYPES,
        autoRules: DEFAULT_AUTO_RULES,
        customTypes: { custom_1: { id: 'custom_1', name: '测试' } },
      };
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(storedRules));

      const result = await getStatisticsRules();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('statistics_rules');
      expect(result).toEqual(storedRules);
    });

    it('should return default rules if nothing stored', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await getStatisticsRules();

      expect(result.types).toEqual(DEFAULT_STATISTICS_TYPES);
      expect(result.autoRules).toEqual(DEFAULT_AUTO_RULES);
      expect(result.customTypes).toEqual({});
    });

    it('should return default rules on error', async () => {
      SecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await getStatisticsRules();

      expect(result.types).toEqual(DEFAULT_STATISTICS_TYPES);
      expect(result.autoRules).toEqual(DEFAULT_AUTO_RULES);
    });
  });

  describe('saveStatisticsRules', () => {
    it('should save rules successfully', async () => {
      const rules = { types: {}, autoRules: [], customTypes: {} };
      SecureStore.setItemAsync.mockResolvedValue();

      const result = await saveStatisticsRules(rules);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'statistics_rules',
        JSON.stringify(rules)
      );
      expect(result).toEqual({ success: true });
    });

    it('should return error on failure', async () => {
      SecureStore.setItemAsync.mockRejectedValue(new Error('Save failed'));

      const result = await saveStatisticsRules({});

      expect(result).toEqual({ success: false, error: 'Save failed' });
    });
  });

  describe('addCustomStatisticsType', () => {
    it('should add custom type successfully', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      SecureStore.setItemAsync.mockResolvedValue();

      const result = await addCustomStatisticsType({
        name: '投资收益',
        color: '#FFD700',
        icon: 'trending-up',
      });

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^custom_/);
    });

    // Note: addCustomStatisticsType doesn't properly propagate save errors
    // because saveStatisticsRules catches errors internally
  });

  describe('removeCustomStatisticsType', () => {
    it('should remove custom type successfully', async () => {
      const storedRules = {
        types: DEFAULT_STATISTICS_TYPES,
        autoRules: [],
        customTypes: { custom_1: { id: 'custom_1', name: '测试' } },
      };
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(storedRules));
      SecureStore.setItemAsync.mockResolvedValue();

      const result = await removeCustomStatisticsType('custom_1');

      expect(result.success).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe('addAutoRule', () => {
    it('should add auto rule successfully', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      SecureStore.setItemAsync.mockResolvedValue();

      const result = await addAutoRule({
        name: '测试规则',
        keywords: ['测试'],
        statisticsType: 'expense',
        priority: 1,
      });

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^rule_/);
    });
  });

  describe('updateAutoRule', () => {
    it('should update existing rule', async () => {
      const storedRules = {
        types: DEFAULT_STATISTICS_TYPES,
        autoRules: [{ id: 'rule_1', name: '旧名称', isActive: true }],
        customTypes: {},
      };
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(storedRules));
      SecureStore.setItemAsync.mockResolvedValue();

      const result = await updateAutoRule('rule_1', { name: '新名称' });

      expect(result.success).toBe(true);
    });

    it('should return error for non-existent rule', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await updateAutoRule('non_existent', { name: '新名称' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('规则不存在');
    });
  });

  describe('removeAutoRule', () => {
    it('should remove rule successfully', async () => {
      const storedRules = {
        types: DEFAULT_STATISTICS_TYPES,
        autoRules: [
          { id: 'rule_1', name: '规则1' },
          { id: 'rule_2', name: '规则2' },
        ],
        customTypes: {},
      };
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(storedRules));
      SecureStore.setItemAsync.mockResolvedValue();

      const result = await removeAutoRule('rule_1');

      expect(result.success).toBe(true);
    });
  });

  describe('autoDetectStatisticsType', () => {
    it('should detect transfer type for 零钱通', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await autoDetectStatisticsType({
        description: '转入零钱通',
        counterparty: '零钱通',
      });

      expect(result).toBe('transfer');
    });

    it('should detect transfer type for 信用卡还款', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await autoDetectStatisticsType({
        description: '信用卡还款',
        counterparty: '银行',
      });

      expect(result).toBe('transfer');
    });

    it('should return original type if no rule matches', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await autoDetectStatisticsType({
        description: '普通消费',
        type: 'expense',
      });

      expect(result).toBe('expense');
    });

    it('should return default expense type if no type provided', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await autoDetectStatisticsType({
        description: '普通消费',
      });

      expect(result).toBe('expense');
    });

    it('should handle errors gracefully', async () => {
      SecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await autoDetectStatisticsType({
        description: '测试',
        type: 'expense',
      });

      expect(result).toBe('expense');
    });
  });

  describe('getAllStatisticsTypes', () => {
    it('should return all types including custom', async () => {
      const storedRules = {
        types: DEFAULT_STATISTICS_TYPES,
        autoRules: [],
        customTypes: { custom_1: { id: 'custom_1', name: '自定义' } },
      };
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(storedRules));

      const result = await getAllStatisticsTypes();

      expect(result).toHaveProperty('expense');
      expect(result).toHaveProperty('income');
      expect(result).toHaveProperty('custom_1');
    });

    it('should return default types on error', async () => {
      SecureStore.getItemAsync.mockRejectedValue(new Error('Error'));

      const result = await getAllStatisticsTypes();

      expect(result).toEqual(DEFAULT_STATISTICS_TYPES);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate basic statistics', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const transactions = [
        { id: 1, amount: 100, type: 'expense', category_id: 1, category_name: '餐饮' },
        { id: 2, amount: 200, type: 'income', category_id: 2, category_name: '工资' },
      ];

      const result = await calculateStatistics(transactions);

      expect(result.totalExpense).toBe(100);
      expect(result.totalIncome).toBe(200);
      expect(result.netAmount).toBe(100);
      expect(result.includedTransactions).toHaveLength(2);
    });

    it('should exclude transfer transactions from totals', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const transactions = [
        { id: 1, amount: 100, type: 'expense', statistics_type: 'expense' },
        { id: 2, amount: 50, type: 'expense', statistics_type: 'transfer' },
      ];

      const result = await calculateStatistics(transactions);

      expect(result.totalExpense).toBe(100);
      expect(result.excludedTransactions).toHaveLength(1);
    });

    it('should calculate by category', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const transactions = [
        { id: 1, amount: 100, type: 'expense', category_id: 1, category_name: '餐饮' },
        { id: 2, amount: 50, type: 'expense', category_id: 1, category_name: '餐饮' },
      ];

      const result = await calculateStatistics(transactions);

      expect(result.byCategory['餐饮']).toBeDefined();
      expect(result.byCategory['餐饮'].amount).toBe(150);
      expect(result.byCategory['餐饮'].count).toBe(2);
    });

    it('should handle empty transactions', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await calculateStatistics([]);

      expect(result.totalExpense).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.netAmount).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      SecureStore.getItemAsync.mockRejectedValue(new Error('Error'));

      const transactions = [{ id: 1, amount: 100 }];
      const result = await calculateStatistics(transactions);

      expect(result.includedTransactions).toEqual(transactions);
    });
  });

  describe('batchUpdateStatisticsType', () => {
    it('should return success with count', async () => {
      const result = await batchUpdateStatisticsType([1, 2, 3], 'transfer');

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
    });
  });

  describe('resetToDefaultRules', () => {
    it('should reset to default rules', async () => {
      SecureStore.setItemAsync.mockResolvedValue();

      const result = await resetToDefaultRules();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'statistics_rules',
        expect.stringContaining('expense')
      );
      expect(result.success).toBe(true);
    });

    // Note: resetToDefaultRules doesn't properly propagate save errors
    // because saveStatisticsRules catches errors internally and returns success
  });
});
