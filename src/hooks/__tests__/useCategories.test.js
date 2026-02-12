// Test file for useCategories hook
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock repository
jest.mock('../../repositories/CategoryRepository', () => ({
  getAll: jest.fn(),
  getByType: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getNextOrderIndex: jest.fn(),
  isInUse: jest.fn(),
  updateOrder: jest.fn(),
  findByName: jest.fn(),
  initializeDefaultCategoriesForUser: jest.fn(),
}));

import useCategories from '../useCategories';
import CategoryRepository from '../../repositories/CategoryRepository';

describe('useCategories', () => {
  const mockUserId = 'test-user-id';
  
  const mockCategories = [
    { id: '1', name: '餐饮', type: 'expense', icon: 'restaurant', color: '#FF6B6B' },
    { id: '2', name: '交通', type: 'expense', icon: 'car', color: '#4ECDC4' },
    { id: '3', name: '工资', type: 'income', icon: 'cash', color: '#45B7D1' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    CategoryRepository.getAll.mockResolvedValue(mockCategories);
    CategoryRepository.getByType.mockResolvedValue([]);
    CategoryRepository.create.mockResolvedValue('new-id');
    CategoryRepository.update.mockResolvedValue(true);
    CategoryRepository.delete.mockResolvedValue(true);
    CategoryRepository.getNextOrderIndex.mockResolvedValue(1);
    CategoryRepository.isInUse.mockResolvedValue(false);
    CategoryRepository.updateOrder.mockResolvedValue();
    CategoryRepository.findByName.mockResolvedValue(null);
    CategoryRepository.initializeDefaultCategoriesForUser.mockResolvedValue();
  });

  describe('Hook 定义', () => {
    test('should be defined', () => {
      expect(useCategories).toBeDefined();
    });

    test('should be a function', () => {
      expect(typeof useCategories).toBe('function');
    });
  });

  describe('初始状态', () => {
    test('应该返回初始状态', () => {
      const { result } = renderHook(() => useCategories(mockUserId));
      
      expect(result.current.categories).toEqual([]);
      expect(result.current.expenseCategories).toEqual([]);
      expect(result.current.incomeCategories).toEqual([]);
      // loading 可能在初始渲染后立即变为 true（因为 useEffect 会自动调用 loadCategories）
      expect(typeof result.current.loading).toBe('boolean');
      expect(result.current.error).toBeNull();
    });

    test('应该返回所有方法', () => {
      const { result } = renderHook(() => useCategories(mockUserId));
      
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.loadCategoriesByType).toBe('function');
      expect(typeof result.current.createCategory).toBe('function');
      expect(typeof result.current.updateCategory).toBe('function');
      expect(typeof result.current.deleteCategory).toBe('function');
      expect(typeof result.current.updateCategoryOrder).toBe('function');
      expect(typeof result.current.findCategoryByName).toBe('function');
      expect(typeof result.current.initializeDefaultCategories).toBe('function');
    });
  });

  describe('加载分类', () => {
    test('应该成功加载分类列表', async () => {
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        await result.current.refresh();
      });

      expect(CategoryRepository.getAll).toHaveBeenCalled();
      expect(result.current.categories.length).toBe(3);
    });

    test('应该正确分离支出和收入分类', async () => {
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.expenseCategories.length).toBe(2);
      expect(result.current.incomeCategories.length).toBe(1);
    });

    test('无用户ID时不应加载分类', async () => {
      const { result } = renderHook(() => useCategories(null));
      
      await act(async () => {
        await result.current.refresh();
      });

      expect(CategoryRepository.getAll).not.toHaveBeenCalled();
    });

    test('应该处理加载错误', async () => {
      CategoryRepository.getAll.mockRejectedValue(new Error('加载失败'));
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBe('加载失败');
    });
  });

  describe('按类型加载分类', () => {
    test('应该成功按类型加载分类', async () => {
      CategoryRepository.getByType.mockResolvedValue(mockCategories.filter(c => c.type === 'expense'));
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      let categories;
      await act(async () => {
        categories = await result.current.loadCategoriesByType('expense');
      });

      expect(CategoryRepository.getByType).toHaveBeenCalledWith('expense', mockUserId);
      expect(categories.length).toBe(2);
    });

    test('无用户ID时应返回空数组', async () => {
      const { result } = renderHook(() => useCategories(null));
      
      let categories;
      await act(async () => {
        categories = await result.current.loadCategoriesByType('expense');
      });

      expect(categories).toEqual([]);
    });

    test('应该处理按类型加载错误', async () => {
      CategoryRepository.getByType.mockRejectedValue(new Error('加载失败'));
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      let categories;
      await act(async () => {
        categories = await result.current.loadCategoriesByType('expense');
      });

      expect(categories).toEqual([]);
    });
  });

  describe('创建分类', () => {
    test('应该成功创建分类', async () => {
      const newCategory = {
        name: '娱乐',
        type: 'expense',
        icon: 'game',
        color: '#FF9500',
      };
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.createCategory(newCategory);
        expect(res.success).toBe(true);
        expect(res.id).toBe('new-id');
      });

      expect(CategoryRepository.create).toHaveBeenCalled();
    });

    test('应该处理创建错误', async () => {
      CategoryRepository.create.mockRejectedValue(new Error('创建失败'));
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.createCategory({});
        expect(res.success).toBe(false);
        expect(res.error).toBe('创建失败');
      });
    });
  });

  describe('更新分类', () => {
    test('应该成功更新分类', async () => {
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.updateCategory('1', { name: '餐饮更新' });
        expect(res.success).toBe(true);
      });

      expect(CategoryRepository.update).toHaveBeenCalledWith('1', { name: '餐饮更新' });
    });

    test('应该处理更新错误', async () => {
      CategoryRepository.update.mockRejectedValue(new Error('更新失败'));
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.updateCategory('1', {});
        expect(res.success).toBe(false);
        expect(res.error).toBe('更新失败');
      });
    });
  });

  describe('删除分类', () => {
    test('应该成功删除分类', async () => {
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.deleteCategory('1');
        expect(res.success).toBe(true);
      });

      expect(CategoryRepository.delete).toHaveBeenCalledWith('1');
    });

    test('分类在使用中时应返回错误', async () => {
      CategoryRepository.isInUse.mockResolvedValue(true);
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.deleteCategory('1');
        expect(res.success).toBe(false);
        expect(res.error).toContain('正在使用中');
      });
    });

    test('应该处理删除错误', async () => {
      CategoryRepository.delete.mockRejectedValue(new Error('删除失败'));
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.deleteCategory('1');
        expect(res.success).toBe(false);
        expect(res.error).toBe('删除失败');
      });
    });
  });

  describe('更新分类排序', () => {
    test('应该成功更新排序', async () => {
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.updateCategoryOrder(['1', '2', '3']);
        expect(res.success).toBe(true);
      });

      expect(CategoryRepository.updateOrder).toHaveBeenCalledWith(['1', '2', '3']);
    });

    test('应该处理排序更新错误', async () => {
      CategoryRepository.updateOrder.mockRejectedValue(new Error('排序失败'));
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.updateCategoryOrder(['1', '2', '3']);
        expect(res.success).toBe(false);
        expect(res.error).toBe('排序失败');
      });
    });
  });

  describe('根据名称查找分类', () => {
    test('应该成功查找分类', async () => {
      CategoryRepository.findByName.mockResolvedValue(mockCategories[0]);
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const category = await result.current.findCategoryByName('餐饮', 'expense');
        expect(category).not.toBeNull();
        expect(category.name).toBe('餐饮');
      });
    });

    test('无用户ID时应返回null', async () => {
      const { result } = renderHook(() => useCategories(null));
      
      await act(async () => {
        const category = await result.current.findCategoryByName('餐饮', 'expense');
        expect(category).toBeNull();
      });
    });

    test('应该处理查找错误', async () => {
      CategoryRepository.findByName.mockRejectedValue(new Error('查找失败'));
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const category = await result.current.findCategoryByName('餐饮', 'expense');
        expect(category).toBeNull();
      });
    });
  });

  describe('初始化默认分类', () => {
    test('应该成功初始化默认分类', async () => {
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.initializeDefaultCategories();
        expect(res.success).toBe(true);
      });

      expect(CategoryRepository.initializeDefaultCategoriesForUser).toHaveBeenCalledWith(mockUserId);
    });

    test('无用户ID时不应初始化', async () => {
      const { result } = renderHook(() => useCategories(null));
      
      await act(async () => {
        const res = await result.current.initializeDefaultCategories();
        expect(res).toBeUndefined();
      });
    });

    test('应该处理初始化错误', async () => {
      CategoryRepository.initializeDefaultCategoriesForUser.mockRejectedValue(new Error('初始化失败'));
      
      const { result } = renderHook(() => useCategories(mockUserId));
      
      await act(async () => {
        const res = await result.current.initializeDefaultCategories();
        expect(res.success).toBe(false);
        expect(res.error).toBe('初始化失败');
      });
    });
  });
});
