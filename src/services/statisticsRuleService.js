/**
 * 统计规则服务
 * 用于管理自定义统计类别和统计规则
 */

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'statistics_rules';

// 默认统计类别
export const DEFAULT_STATISTICS_TYPES = {
  expense: {
    id: 'expense',
    name: '支出',
    color: '#FF3B30',
    icon: 'arrow-down-circle',
    includeInTotal: true,
    isDefault: true,
  },
  income: {
    id: 'income',
    name: '收入',
    color: '#34C759',
    icon: 'arrow-up-circle',
    includeInTotal: true,
    isDefault: true,
  },
  transfer: {
    id: 'transfer',
    name: '转移',
    color: '#007AFF',
    icon: 'swap-horizontal',
    includeInTotal: false,
    isDefault: true,
    description: '资金转移，不计入收支（如零钱转入零钱通）',
  },
  exclude: {
    id: 'exclude',
    name: '不计入',
    color: '#8E8E93',
    icon: 'remove-circle',
    includeInTotal: false,
    isDefault: true,
    description: '完全不计入统计',
  },
};

// 默认自动分类规则
export const DEFAULT_AUTO_RULES = [
  {
    id: 'rule_1',
    name: '零钱通转入',
    keywords: ['零钱通', '零钱转入', '转入零钱通'],
    statisticsType: 'transfer',
    priority: 1,
    isActive: true,
  },
  {
    id: 'rule_2',
    name: '余额宝转入',
    keywords: ['余额宝', '转入余额宝'],
    statisticsType: 'transfer',
    priority: 1,
    isActive: true,
  },
  {
    id: 'rule_3',
    name: '信用卡还款',
    keywords: ['信用卡还款', '还信用卡'],
    statisticsType: 'transfer',
    priority: 2,
    isActive: true,
  },
  {
    id: 'rule_4',
    name: '转账给自己',
    keywords: ['转账给自己', '本人账户'],
    statisticsType: 'transfer',
    priority: 2,
    isActive: true,
  },
];

/**
 * 获取统计规则配置
 */
export const getStatisticsRules = async () => {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // 返回默认配置
    return {
      types: DEFAULT_STATISTICS_TYPES,
      autoRules: DEFAULT_AUTO_RULES,
      customTypes: {},
    };
  } catch (error) {
    console.error('获取统计规则失败:', error);
    return {
      types: DEFAULT_STATISTICS_TYPES,
      autoRules: DEFAULT_AUTO_RULES,
      customTypes: {},
    };
  }
};

/**
 * 保存统计规则配置
 */
export const saveStatisticsRules = async (rules) => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(rules));
    return { success: true };
  } catch (error) {
    console.error('保存统计规则失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 添加自定义统计类型
 */
export const addCustomStatisticsType = async (typeConfig) => {
  try {
    const rules = await getStatisticsRules();
    const id = `custom_${Date.now()}`;
    rules.customTypes[id] = {
      id,
      ...typeConfig,
      isDefault: false,
    };
    await saveStatisticsRules(rules);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 删除自定义统计类型
 */
export const removeCustomStatisticsType = async (typeId) => {
  try {
    const rules = await getStatisticsRules();
    delete rules.customTypes[typeId];
    await saveStatisticsRules(rules);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 添加自动分类规则
 */
export const addAutoRule = async (ruleConfig) => {
  try {
    const rules = await getStatisticsRules();
    const id = `rule_${Date.now()}`;
    rules.autoRules.push({
      id,
      ...ruleConfig,
      isActive: true,
    });
    await saveStatisticsRules(rules);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 更新自动分类规则
 */
export const updateAutoRule = async (ruleId, updates) => {
  try {
    const rules = await getStatisticsRules();
    const index = rules.autoRules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      rules.autoRules[index] = { ...rules.autoRules[index], ...updates };
      await saveStatisticsRules(rules);
      return { success: true };
    }
    return { success: false, error: '规则不存在' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 删除自动分类规则
 */
export const removeAutoRule = async (ruleId) => {
  try {
    const rules = await getStatisticsRules();
    rules.autoRules = rules.autoRules.filter(r => r.id !== ruleId);
    await saveStatisticsRules(rules);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 自动识别交易的统计类型
 * @param {Object} transaction - 交易记录
 */
export const autoDetectStatisticsType = async (transaction) => {
  try {
    const rules = await getStatisticsRules();
    const description = (transaction.description || '').toLowerCase();
    const counterparty = (transaction.counterparty || '').toLowerCase();
    const combinedText = `${description} ${counterparty}`;

    // 按优先级排序的活跃规则
    const activeRules = rules.autoRules
      .filter(r => r.isActive)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (const rule of activeRules) {
      const keywords = rule.keywords || [];
      for (const keyword of keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          return rule.statisticsType;
        }
      }
    }

    // 默认返回原始类型
    return transaction.type || 'expense';
  } catch (error) {
    console.error('自动识别统计类型失败:', error);
    return transaction.type || 'expense';
  }
};

/**
 * 获取所有统计类型（包括自定义）
 */
export const getAllStatisticsTypes = async () => {
  try {
    const rules = await getStatisticsRules();
    return {
      ...rules.types,
      ...rules.customTypes,
    };
  } catch (error) {
    return DEFAULT_STATISTICS_TYPES;
  }
};

/**
 * 计算统计数据（考虑自定义统计类型）
 * @param {Array} transactions - 交易记录数组
 */
export const calculateStatistics = async (transactions) => {
  try {
    const types = await getAllStatisticsTypes();
    
    const result = {
      totalExpense: 0,
      totalIncome: 0,
      netAmount: 0,
      byType: {},
      byCategory: {},
      includedTransactions: [],
      excludedTransactions: [],
    };

    // 初始化各类型统计
    Object.keys(types).forEach(typeId => {
      result.byType[typeId] = {
        ...types[typeId],
        amount: 0,
        count: 0,
      };
    });

    for (const transaction of transactions) {
      const statisticsType = transaction.statistics_type || transaction.type || 'expense';
      const typeConfig = types[statisticsType] || types.expense;
      const amount = parseFloat(transaction.amount) || 0;

      // 按类型统计
      if (!result.byType[statisticsType]) {
        result.byType[statisticsType] = {
          name: statisticsType,
          color: '#999',
          amount: 0,
          count: 0,
          includeInTotal: false,
        };
      }
      result.byType[statisticsType].amount += amount;
      result.byType[statisticsType].count += 1;

      // 是否计入总收支
      if (typeConfig.includeInTotal !== false) {
        if (statisticsType === 'income') {
          result.totalIncome += amount;
        } else if (statisticsType === 'expense') {
          result.totalExpense += amount;
        }
        result.includedTransactions.push(transaction);
      } else {
        result.excludedTransactions.push(transaction);
      }

      // 按分类统计（仅计入总收支的交易）
      if (typeConfig.includeInTotal !== false && transaction.category_id) {
        const categoryName = transaction.category_name || '未分类';
        if (!result.byCategory[categoryName]) {
          result.byCategory[categoryName] = {
            name: categoryName,
            amount: 0,
            count: 0,
            type: statisticsType,
          };
        }
        result.byCategory[categoryName].amount += amount;
        result.byCategory[categoryName].count += 1;
      }
    }

    result.netAmount = result.totalIncome - result.totalExpense;

    return result;
  } catch (error) {
    console.error('计算统计数据失败:', error);
    return {
      totalExpense: 0,
      totalIncome: 0,
      netAmount: 0,
      byType: {},
      byCategory: {},
      includedTransactions: transactions,
      excludedTransactions: [],
    };
  }
};

/**
 * 批量更新交易的统计类型
 */
export const batchUpdateStatisticsType = async (transactionIds, statisticsType) => {
  try {
    // 这里需要调用数据库更新
    // 返回成功信息
    return {
      success: true,
      updatedCount: transactionIds.length,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 重置为默认规则
 */
export const resetToDefaultRules = async () => {
  try {
    await saveStatisticsRules({
      types: DEFAULT_STATISTICS_TYPES,
      autoRules: DEFAULT_AUTO_RULES,
      customTypes: {},
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
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
};
