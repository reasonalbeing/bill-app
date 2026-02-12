/**
 * AIChatScreen 组件测试
 * 测试 AI 聊天记账功能
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock Expo modules
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock services
jest.mock('../../../services/aiService', () => ({
  parseNaturalLanguage: jest.fn(),
  analyzeSpending: jest.fn(),
  getBudgetAdvice: jest.fn(),
}));

jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(() => ({ uid: 'test-user-id' })),
}));

jest.mock('../../../services/aiConfigService', () => ({
  getAIConfig: jest.fn(() => Promise.resolve({ isEnabled: true })),
}));

// Mock hooks
jest.mock('../../../hooks/useTransactions', () => ({
  useTransactions: jest.fn(() => ({
    transactions: [],
    createTransaction: jest.fn(() => Promise.resolve({ success: true })),
  })),
}));

jest.mock('../../../hooks/useCategories', () => ({
  useCategories: jest.fn(() => ({
    categories: [
      { id: '1', name: '餐饮', type: 'expense' },
      { id: '2', name: '交通', type: 'expense' },
      { id: '3', name: '工资', type: 'income' },
    ],
    expenseCategories: [
      { id: '1', name: '餐饮', type: 'expense' },
      { id: '2', name: '交通', type: 'expense' },
    ],
    incomeCategories: [
      { id: '3', name: '工资', type: 'income' },
    ],
  })),
}));

// Import after mocks
import AIChatScreen from '../AIChatScreen';
import { parseNaturalLanguage, analyzeSpending, getBudgetAdvice } from '../../../services/aiService';
import { getCurrentUser } from '../../../services/authService';
import { getAIConfig } from '../../../services/aiConfigService';
import { useTransactions } from '../../../hooks/useTransactions';
import { useCategories } from '../../../hooks/useCategories';
import { Alert } from 'react-native';

describe('AIChatScreen', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getAIConfig.mockResolvedValue({ isEnabled: true });
    getCurrentUser.mockReturnValue({ uid: 'test-user-id' });
    useTransactions.mockReturnValue({
      transactions: [],
      createTransaction: jest.fn(() => Promise.resolve({ success: true })),
    });
    useCategories.mockReturnValue({
      categories: [
        { id: '1', name: '餐饮', type: 'expense' },
        { id: '2', name: '交通', type: 'expense' },
        { id: '3', name: '工资', type: 'income' },
      ],
      expenseCategories: [
        { id: '1', name: '餐饮', type: 'expense' },
        { id: '2', name: '交通', type: 'expense' },
      ],
      incomeCategories: [
        { id: '3', name: '工资', type: 'income' },
      ],
    });
  });

  describe('组件渲染', () => {
    it('应该正确渲染欢迎消息', () => {
      const { getByText } = render(<AIChatScreen navigation={mockNavigation} />);
      expect(getByText(/你好！我是你的智能记账助手/)).toBeTruthy();
    });

    it('应该渲染快速操作按钮', () => {
      const { getByText } = render(<AIChatScreen navigation={mockNavigation} />);
      expect(getByText('吃饭记账')).toBeTruthy();
      expect(getByText('交通记账')).toBeTruthy();
      expect(getByText('购物记账')).toBeTruthy();
      expect(getByText('收入记账')).toBeTruthy();
      expect(getByText('消费分析')).toBeTruthy();
      expect(getByText('省钱建议')).toBeTruthy();
    });

    it('应该渲染输入框', () => {
      const { getByPlaceholderText } = render(<AIChatScreen navigation={mockNavigation} />);
      expect(getByPlaceholderText('输入记账内容或问题...')).toBeTruthy();
    });
  });

  describe('AI配置检查', () => {
    it('当AI未启用时应该显示警告', async () => {
      getAIConfig.mockResolvedValue({ isEnabled: false });
      
      render(<AIChatScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    it('当AI未启用时应该提供配置选项', async () => {
      getAIConfig.mockResolvedValue({ isEnabled: false });
      
      render(<AIChatScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'AI功能未启用',
          '请先配置AI服务才能使用聊天记账功能',
          expect.arrayContaining([
            expect.objectContaining({ text: '取消' }),
            expect.objectContaining({ text: '去配置' }),
          ])
        );
      });
    });
  });

  describe('快速操作', () => {
    it('点击快速操作按钮应该填充输入框', () => {
      const { getByText, getByPlaceholderText } = render(<AIChatScreen navigation={mockNavigation} />);
      
      const quickButton = getByText('吃饭记账');
      fireEvent.press(quickButton);
      
      const input = getByPlaceholderText('输入记账内容或问题...');
      expect(input.props.value).toBe('中午吃饭花了35元');
    });

    it('点击快速操作按钮应该隐藏快速操作栏', () => {
      const { getByText, queryByText } = render(<AIChatScreen navigation={mockNavigation} />);
      
      const quickButton = getByText('吃饭记账');
      fireEvent.press(quickButton);
      
      // 快速操作栏应该被隐藏
      expect(queryByText('快速操作')).toBeNull();
    });
  });

  describe('发送消息', () => {
    it('输入为空时不应该发送消息', () => {
      const { getByPlaceholderText } = render(<AIChatScreen navigation={mockNavigation} />);
      
      const input = getByPlaceholderText('输入记账内容或问题...');
      fireEvent.changeText(input, '');
      
      expect(parseNaturalLanguage).not.toHaveBeenCalled();
    });

    it('应该正确发送用户消息', async () => {
      parseNaturalLanguage.mockResolvedValue({
        action: 'reply',
        message: '收到您的消息',
      });
      
      const { getByPlaceholderText, getByText, UNSAFE_queryAllByType } = render(<AIChatScreen navigation={mockNavigation} />);
      
      const input = getByPlaceholderText('输入记账内容或问题...');
      fireEvent.changeText(input, '测试消息');
      
      // 找到发送按钮并点击
      const sendButtons = UNSAFE_queryAllByType('TouchableOpacity');
      const sendButton = sendButtons.find(btn => {
        const icon = btn.props.children;
        return icon && icon.type === 'Ionicons';
      });
      
      if (sendButton) {
        fireEvent.press(sendButton);
      }
      
      // 消息应该被添加到列表
      expect(getByText('测试消息')).toBeTruthy();
    });

    it('发送记账消息应该调用 parseNaturalLanguage', async () => {
      parseNaturalLanguage.mockResolvedValue({
        action: 'reply',
        message: '已收到',
      });
      
      const { getByPlaceholderText, UNSAFE_queryAllByType } = render(<AIChatScreen navigation={mockNavigation} />);
      
      const input = getByPlaceholderText('输入记账内容或问题...');
      fireEvent.changeText(input, '吃饭花了30元');
      
      // 找到发送按钮并点击
      const sendButtons = UNSAFE_queryAllByType('TouchableOpacity');
      const sendButton = sendButtons[sendButtons.length - 1]; // 最后一个按钮通常是发送按钮
      
      if (sendButton) {
        fireEvent.press(sendButton);
      }
      
      // 等待异步操作
      await waitFor(() => {
        expect(parseNaturalLanguage).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('用户状态', () => {
    it('无用户时不应该崩溃', () => {
      getCurrentUser.mockReturnValue(null);
      
      const { getByPlaceholderText } = render(<AIChatScreen navigation={mockNavigation} />);
      expect(getByPlaceholderText('输入记账内容或问题...')).toBeTruthy();
    });

    it('用户无uid时不应该崩溃', () => {
      getCurrentUser.mockReturnValue({});
      
      const { getByPlaceholderText } = render(<AIChatScreen navigation={mockNavigation} />);
      expect(getByPlaceholderText('输入记账内容或问题...')).toBeTruthy();
    });
  });
});
