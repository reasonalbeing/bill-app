import { useState, useEffect, useCallback } from 'react';
import BudgetRepository from '../repositories/BudgetRepository';
import TransactionRepository from '../repositories/TransactionRepository';

/**
 * 预算数据Hook
 * 用于管理预算数据的增删改查及预算使用情况计算
 */
export const useBudgets = (userId) => {
  const [budgets, setBudgets] = useState([];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 加载预算列表
  const loadBudgets = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await BudgetRepository.getByUserId(userId);
      
      // 计算每个预算的使用情况
      const budgetsWithSpending = await Promise.all(
        data.map(async (budget) => {
          const spending = await calculateBudgetSpending(budget);
          return {
            ...budget,
            ...spending,
          };
        })
      );
      
      setBudgets(budgetsWithSpending);
    } catch (err) {
      console.error('加载预算失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 计算预算使用情况
  const calculateBudgetSpending = async (budget) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let startDate = budget.start_date;
      let endDate = budget.end_date;
      
      // 根据重复类型调整日期范围
      if (budget.recurring === 'monthly') {
        // 本月预算：从本月1号到今天
        const currentMonth = today.substring(0, 7); // YYYY-MM
        startDate = `${currentMonth}-01`;
        endDate = today;
      } else if (budget.recurring === 'yearly') {
        // 本年预算：从今年1月1号到今天
        const currentYear = today.substring(0, 4); // YYYY
        startDate = `${currentYear}-01-01`;
        endDate = today;
      }
      
      // 查询该分类在日期范围内的支出
      let spent = 0;
      if (budget.category_id) {
        // 分类预算
        const transactions = await TransactionRepository.getByUserId(userId, {
          type: 'expense',
          categoryId: budget.category_id,
          startDate,
          endDate,
        });
        spent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      } else {
        // 总预算
        const transactions = await TransactionRepository.getByUserId(userId, {
          type: 'expense',
          startDate,
          endDate,
        });
        spent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      }
      
      const remaining = parseFloat(budget.amount) - spent;
      const percentage = budget.amount > 0 ? (spent / parseFloat(budget.amount)) * 100 : 0;
      
      return {
        spent,
        remaining: Math.max(0, remaining),
        percentage: Math.min(100, percentage),
        isOverBudget: remaining < 0,
      };
    } catch (err) {
      console.error('计算预算使用情况失败:', err);
      return { spent: 0, remaining: budget.amount, percentage: 0, isOverBudget: false };
    }
  };

  // 创建预算
  const createBudget = useCallback(async (budgetData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newId = await BudgetRepository.create({
        ...budgetData,
        user_id: userId,
      });
      
      // 刷新列表
      await loadBudgets();
      
      return { success: true, id: newId };
    } catch (err) {
      console.error('创建预算失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId, loadBudgets]);

  // 更新预算
  const updateBudget = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await BudgetRepository.update(id, updateData);
      
      if (success) {
        await loadBudgets();
      }
      
      return { success };
    } catch (err) {
      console.error('更新预算失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadBudgets]);

  // 删除预算
  const deleteBudget = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await BudgetRepository.delete(id);
      
      if (success) {
        await loadBudgets();
      }
      
      return { success };
    } catch (err) {
      console.error('删除预算失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadBudgets]);

  // 刷新预算使用情况（不重新加载列表）
  const refreshSpending = useCallback(async () => {
    if (!userId || budgets.length === 0) return;
    
    try {
      const updatedBudgets = await Promise.all(
        budgets.map(async (budget) => {
          const spending = await calculateBudgetSpending(budget);
          return {
            ...budget,
            ...spending,
          };
        })
      );
      
      setBudgets(updatedBudgets);
    } catch (err) {
      console.error('刷新预算使用情况失败:', err);
    }
  }, [userId, budgets]);

  // 初始加载
  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return {
    budgets,
    loading,
    error,
    refresh: loadBudgets,
    refreshSpending,
    createBudget,
    updateBudget,
    deleteBudget,
  };
};

export default useBudgets;
