// Test file for useBudgets hook
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock repositories first
jest.mock('../../repositories/BudgetRepository', () => ({
  getByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getById: jest.fn(),
}));

jest.mock('../../repositories/TransactionRepository', () => ({
  getByUserId: jest.fn(),
  getByCategoryIdAndDateRange: jest.fn(),
}));

import useBudgets from '../useBudgets';
import BudgetRepository from '../../repositories/BudgetRepository';
import TransactionRepository from '../../repositories/TransactionRepository';

describe('useBudgets', () => {
  const mockUserId = 'test-user-id';
  
  const mockBudgets = [
    {
      id: '1',
      user_id: mockUserId,
      amount: 1000,
      category_id: 'cat1',
      category_name: '食品',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      recurring: 'monthly',
    },
    {
      id: '2',
      user_id: mockUserId,
      amount: 500,
      category_id: null,
      category_name: '总预算',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      recurring: 'none',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    BudgetRepository.getByUserId.mockResolvedValue(mockBudgets);
    TransactionRepository.getByCategoryIdAndDateRange.mockResolvedValue([]);
    TransactionRepository.getByUserId.mockResolvedValue([]);
  });

  describe('初始状态', () => {
    it('应该定义 useBudgets 函数', () => {
      expect(useBudgets).toBeDefined();
    });

    it('应该是一个函数', () => {
      expect(typeof useBudgets).toBe('function');
    });

    it('应该返回正确的初始状态结构', () => {
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      expect(result.current).toHaveProperty('budgets');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refresh');
      expect(result.current).toHaveProperty('createBudget');
      expect(result.current).toHaveProperty('deleteBudget');
    });
  });

  describe('加载预算', () => {
    it('应该成功加载预算列表', async () => {
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      await act(async () => {
        await result.current.refresh();
      });

      expect(BudgetRepository.getByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result.current.budgets.length).toBeGreaterThan(0);
    });

    it('无用户ID时不应加载预算', async () => {
      const { result } = renderHook(() => useBudgets(null));
      
      await act(async () => {
        await result.current.refresh();
      });

      expect(BudgetRepository.getByUserId).not.toHaveBeenCalled();
    });

    it('应该处理加载错误', async () => {
      BudgetRepository.getByUserId.mockRejectedValue(new Error('加载失败'));
      
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBe('加载失败');
    });
  });

  describe('创建预算', () => {
    it('应该成功创建预算', async () => {
      const newBudget = {
        amount: 2000,
        category_id: 'cat2',
        start_date: '2024-02-01',
        end_date: '2024-02-28',
        recurring: 'monthly',
      };
      
      BudgetRepository.create.mockResolvedValue({ id: '3', ...newBudget });
      
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      await act(async () => {
        const res = await result.current.createBudget(newBudget);
        expect(res.success).toBe(true);
      });

      expect(BudgetRepository.create).toHaveBeenCalled();
    });

    it('应该处理创建错误', async () => {
      BudgetRepository.create.mockRejectedValue(new Error('创建失败'));
      
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      await act(async () => {
        const res = await result.current.createBudget({});
        expect(res.success).toBe(false);
      });
    });
  });

  describe('删除预算', () => {
    it('应该成功删除预算', async () => {
      BudgetRepository.delete.mockResolvedValue(true);
      
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      await act(async () => {
        const res = await result.current.deleteBudget('1');
        expect(res).toHaveProperty('success');
      });

      expect(BudgetRepository.delete).toHaveBeenCalledWith('1');
    });

    it('应该处理删除错误', async () => {
      BudgetRepository.delete.mockRejectedValue(new Error('删除失败'));
      
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      await act(async () => {
        const res = await result.current.deleteBudget('1');
        expect(res.success).toBe(false);
      });
    });
  });

  describe('盈余转移', () => {
    it('应该调用转移盈余方法', async () => {
      BudgetRepository.update.mockResolvedValue({ success: true });
      
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      await act(async () => {
        const res = await result.current.transferSurplus('1', 100);
        expect(res).toHaveProperty('success');
      });
    });

    it('应该处理转移错误', async () => {
      BudgetRepository.update.mockRejectedValue(new Error('转移失败'));
      
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      await act(async () => {
        const res = await result.current.transferSurplus('1', 100);
        expect(res.success).toBe(false);
      });
    });
  });

  describe('刷新支出', () => {
    it('应该刷新预算支出', async () => {
      const { result } = renderHook(() => useBudgets(mockUserId));
      
      await act(async () => {
        await result.current.refresh();
      });

      await act(async () => {
        await result.current.refreshSpending();
      });

      expect(BudgetRepository.getByUserId).toHaveBeenCalledTimes(2);
    });
  });
});
