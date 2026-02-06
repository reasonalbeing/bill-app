import { useState, useEffect, useCallback } from 'react';
import TransactionRepository from '../repositories/TransactionRepository';

/**
 * 账单数据Hook
 * 用于管理账单数据的增删改查
 */
export const useTransactions = (userId, options = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 加载账单列表
  const loadTransactions = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await TransactionRepository.getByUserId(userId, options);
      setTransactions(data);
    } catch (err) {
      console.error('加载账单失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, JSON.stringify(options)]);

  // 加载统计数据
  const loadStatistics = useCallback(async (statsOptions = {}) => {
    if (!userId) return;
    
    try {
      const data = await TransactionRepository.getStatistics(userId, statsOptions);
      setStatistics(data);
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  }, [userId]);

  // 创建账单
  const createTransaction = useCallback(async (transactionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newId = await TransactionRepository.create({
        ...transactionData,
        user_id: userId,
      });
      
      // 刷新列表
      await loadTransactions();
      
      return { success: true, id: newId };
    } catch (err) {
      console.error('创建账单失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId, loadTransactions]);

  // 更新账单
  const updateTransaction = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await TransactionRepository.update(id, updateData);
      
      if (success) {
        await loadTransactions();
      }
      
      return { success };
    } catch (err) {
      console.error('更新账单失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  // 删除账单
  const deleteTransaction = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await TransactionRepository.delete(id);
      
      if (success) {
        await loadTransactions();
      }
      
      return { success };
    } catch (err) {
      console.error('删除账单失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  // 批量导入账单
  const importTransactions = useCallback(async (transactionsData) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await TransactionRepository.batchCreate(
        transactionsData.map(t => ({ ...t, user_id: userId }))
      );
      
      await loadTransactions();
      
      return { success: true, ...results };
    } catch (err) {
      console.error('导入账单失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId, loadTransactions]);

  // 初始加载
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    statistics,
    loading,
    error,
    refresh: loadTransactions,
    loadStatistics,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
  };
};

export default useTransactions;
