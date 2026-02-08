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
      if (budget.recurring === 'daily') {
        // 日预算：当天
        startDate = today;
        endDate = today;
      } else if (budget.recurring === 'monthly') {
        // 本月预算：从本月1号到今天
        const currentMonth = today.substring(0, 7); // YYYY-MM
        startDate = `${currentMonth}-01`;
        endDate = today;
      } else if (budget.recurring === 'yearly') {
        // 本年预算：从今年1月1号到今天
        const currentYear = today.substring(0, 4); // YYYY
        startDate = `${currentYear}-01-01`;
        endDate = today;
      } else if (budget.recurring === 'custom' && budget.custom_recurring) {
        // 自定义预算：根据设置的频率计算
        const { frequency, interval } = budget.custom_recurring;
        const currentDate = new Date();
        
        if (frequency === 'daily') {
          // 每日预算
          startDate = today;
          endDate = today;
        } else if (frequency === 'weekly') {
          // 每周预算：从本周一到今天
          const dayOfWeek = currentDate.getDay();
          const monday = new Date(currentDate);
          monday.setDate(currentDate.getDate() - (dayOfWeek || 7) + 1);
          startDate = monday.toISOString().split('T')[0];
          endDate = today;
        } else if (frequency === 'monthly') {
          // 每月预算：从本月1号到今天
          const currentMonth = today.substring(0, 7); // YYYY-MM
          startDate = `${currentMonth}-01`;
          endDate = today;
        }
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
      const surplus = Math.max(0, remaining);
      
      return {
        spent,
        remaining: Math.max(0, remaining),
        percentage: Math.min(100, percentage),
        isOverBudget: remaining < 0,
        surplus
      };
    } catch (err) {
      console.error('计算预算使用情况失败:', err);
      return { spent: 0, remaining: budget.amount, percentage: 0, isOverBudget: false, surplus: budget.amount };
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

  // 盈余转入
  const transferSurplus = useCallback(async (budgetId, amount) => {
    try {
      // 找到当前预算
      const currentBudget = budgets.find(b => b.id === budgetId);
      if (!currentBudget) {
        return { success: false, error: '预算不存在' };
      }

      // 检查金额是否有效
      const surplus = currentBudget.surplus || 0;
      if (amount <= 0 || amount > surplus) {
        return { success: false, error: '无效的转入金额' };
      }

      // 创建下一期预算
      let newStartDate, newEndDate;
      const startDate = new Date(currentBudget.start_date);
      const endDate = new Date(currentBudget.end_date);

      // 根据重复类型计算下一期日期
      if (currentBudget.recurring === 'daily') {
        newStartDate = new Date(startDate.setDate(startDate.getDate() + 1));
        newEndDate = new Date(endDate.setDate(endDate.getDate() + 1));
      } else if (currentBudget.recurring === 'monthly') {
        newStartDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
        newEndDate = new Date(endDate.setMonth(endDate.getMonth() + 1));
      } else if (currentBudget.recurring === 'yearly') {
        newStartDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
        newEndDate = new Date(endDate.setFullYear(endDate.getFullYear() + 1));
      } else if (currentBudget.recurring === 'custom' && currentBudget.custom_recurring) {
        const { frequency, interval } = currentBudget.custom_recurring;
        if (frequency === 'daily') {
          newStartDate = new Date(startDate.setDate(startDate.getDate() + interval));
          newEndDate = new Date(endDate.setDate(endDate.getDate() + interval));
        } else if (frequency === 'weekly') {
          newStartDate = new Date(startDate.setDate(startDate.getDate() + (interval * 7)));
          newEndDate = new Date(endDate.setDate(endDate.getDate() + (interval * 7)));
        } else if (frequency === 'monthly') {
          newStartDate = new Date(startDate.setMonth(startDate.getMonth() + interval));
          newEndDate = new Date(endDate.setMonth(endDate.getMonth() + interval));
        } else {
          return { success: false, error: '不支持的预算周期' };
        }
      } else {
        return { success: false, error: '不支持的预算周期' };
      }

      // 创建新预算，金额为原预算金额加上转入的盈余
      const newBudgetAmount = parseFloat(currentBudget.amount) + amount;
      const newBudgetData = {
        user_id: userId,
        amount: newBudgetAmount,
        category_id: currentBudget.category_id,
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
        recurring: currentBudget.recurring,
        custom_recurring: currentBudget.custom_recurring,
        description: `${currentBudget.description || ''} (含转入盈余 ¥${amount.toFixed(2)})`,
      };

      // 保存新预算
      const newBudgetId = await BudgetRepository.create(newBudgetData);

      // 刷新预算列表
      await loadBudgets();

      return { success: true, newBudgetId };
    } catch (err) {
      console.error('转入盈余失败:', err);
      return { success: false, error: err.message };
    }
  }, [userId, budgets, loadBudgets]);

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
    transferSurplus,
  };
};

export default useBudgets;
