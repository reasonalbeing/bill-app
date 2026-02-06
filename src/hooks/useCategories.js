import { useState, useEffect, useCallback } from 'react';
import CategoryRepository from '../repositories/CategoryRepository';

/**
 * 分类数据Hook
 * 用于管理分类数据的增删改查
 */
export const useCategories = (userId, options = {}) => {
  const [categories, setCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { includeDefault = true } = options;

  // 加载所有分类
  const loadCategories = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await CategoryRepository.getAll({ userId, includeDefault });
      setCategories(data);
      
      // 分离收入和支出分类
      setExpenseCategories(data.filter(c => c.type === 'expense'));
      setIncomeCategories(data.filter(c => c.type === 'income'));
    } catch (err) {
      console.error('加载分类失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, includeDefault]);

  // 按类型加载分类
  const loadCategoriesByType = useCallback(async (type) => {
    if (!userId) return [];
    
    try {
      return await CategoryRepository.getByType(type, userId);
    } catch (err) {
      console.error(`加载${type}分类失败:`, err);
      return [];
    }
  }, [userId]);

  // 创建分类
  const createCategory = useCallback(async (categoryData) => {
    setLoading(true);
    setError(null);
    
    try {
      // 获取下一个排序索引
      const orderIndex = await CategoryRepository.getNextOrderIndex(categoryData.type);
      
      const newId = await CategoryRepository.create({
        ...categoryData,
        user_id: userId,
        order_index: orderIndex,
        is_default: false,
      });
      
      await loadCategories();
      
      return { success: true, id: newId };
    } catch (err) {
      console.error('创建分类失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId, loadCategories]);

  // 更新分类
  const updateCategory = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await CategoryRepository.update(id, updateData);
      
      if (success) {
        await loadCategories();
      }
      
      return { success };
    } catch (err) {
      console.error('更新分类失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  // 删除分类
  const deleteCategory = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // 检查分类是否在使用中
      const isInUse = await CategoryRepository.isInUse(id);
      if (isInUse) {
        return { 
          success: false, 
          error: '该分类正在使用中，无法删除。请先删除或修改相关账单。' 
        };
      }
      
      const success = await CategoryRepository.delete(id);
      
      if (success) {
        await loadCategories();
      }
      
      return { success };
    } catch (err) {
      console.error('删除分类失败:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  // 更新分类排序
  const updateCategoryOrder = useCallback(async (categoryIds) => {
    try {
      await CategoryRepository.updateOrder(categoryIds);
      await loadCategories();
      return { success: true };
    } catch (err) {
      console.error('更新分类排序失败:', err);
      return { success: false, error: err.message };
    }
  }, [loadCategories]);

  // 根据名称查找分类（用于自动分类）
  const findCategoryByName = useCallback(async (name, type) => {
    if (!userId) return null;
    
    try {
      return await CategoryRepository.findByName(name, type, userId);
    } catch (err) {
      console.error('查找分类失败:', err);
      return null;
    }
  }, [userId]);

  // 为用户初始化默认分类
  const initializeDefaultCategories = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      await CategoryRepository.initializeDefaultCategoriesForUser(userId);
      await loadCategories();
      return { success: true };
    } catch (err) {
      console.error('初始化默认分类失败:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId, loadCategories]);

  // 初始加载
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    expenseCategories,
    incomeCategories,
    loading,
    error,
    refresh: loadCategories,
    loadCategoriesByType,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrder,
    findCategoryByName,
    initializeDefaultCategories,
  };
};

export default useCategories;
