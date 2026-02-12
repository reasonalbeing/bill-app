import {
  sendMessageToAI,
  parseNaturalLanguage,
  analyzeSpending,
  getBudgetAdvice,
} from '../aiService';

jest.mock('../aiConfigService', () => ({
  getAIConfig: jest.fn(),
  API_PROVIDERS: {
    siliconflow: { id: 'siliconflow', name: '硅基流动' },
    openai: { id: 'openai', name: 'OpenAI' },
    anthropic: { id: 'anthropic', name: 'Anthropic' },
    baidu: { id: 'baidu', name: '百度' },
    aliyun: { id: 'aliyun', name: '阿里云' },
  },
}));

import { getAIConfig } from '../aiConfigService';

describe('aiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('sendMessageToAI', () => {
    it('should throw error if AI is not enabled', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: false,
        apiKey: '',
      });

      await expect(sendMessageToAI([{ role: 'user', content: 'Hello' }])).rejects.toThrow('AI功能未启用或未配置API密钥');
    });

    it('should throw error if API key is missing', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: '',
      });

      await expect(sendMessageToAI([{ role: 'user', content: 'Hello' }])).rejects.toThrow('AI功能未启用或未配置API密钥');
    });

    it('should throw error for unknown provider', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'unknown',
      });

      await expect(sendMessageToAI([{ role: 'user', content: 'Hello' }])).rejects.toThrow('未知的API提供商');
    });

    it('should send message to siliconflow successfully', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'siliconflow',
        endpoint: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-V3.2',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello, how can I help?' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      });

      const result = await sendMessageToAI([{ role: 'user', content: 'Hello' }]);

      expect(result.content).toBe('Hello, how can I help?');
    });

    it('should send message to openai successfully', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello from OpenAI!' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      });

      const result = await sendMessageToAI([{ role: 'user', content: 'Hello' }]);

      expect(result.content).toBe('Hello from OpenAI!');
    });

    it('should send message to anthropic successfully', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1',
        model: 'claude-3-opus',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Hello from Claude!' }],
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      });

      const result = await sendMessageToAI([{ role: 'user', content: 'Hello' }]);

      expect(result.content).toBe('Hello from Claude!');
    });

    it('should send message to baidu successfully', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'baidu',
        endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
        model: 'ernie-bot-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello from Baidu!' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      });

      const result = await sendMessageToAI([{ role: 'user', content: 'Hello' }]);

      expect(result.content).toBe('Hello from Baidu!');
    });

    it('should send message to aliyun successfully', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'aliyun',
        endpoint: 'https://dashscope.aliyuncs.com/api/v1',
        model: 'qwen-max',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          output: { text: 'Hello from Aliyun!' },
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      });

      const result = await sendMessageToAI([{ role: 'user', content: 'Hello' }]);

      expect(result.content).toBe('Hello from Aliyun!');
    });

    it('should throw error on API failure', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: false,
        text: async () => 'Invalid API key',
      });

      await expect(sendMessageToAI([{ role: 'user', content: 'Hello' }])).rejects.toThrow('API请求失败');
    });

    it('should handle network errors', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(sendMessageToAI([{ role: 'user', content: 'Hello' }])).rejects.toThrow('Network error');
    });

    it('should handle empty response', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '' } }],
          usage: {},
        }),
      });

      const result = await sendMessageToAI([{ role: 'user', content: 'Hello' }]);

      expect(result.content).toBe('');
    });
  });

  describe('parseNaturalLanguage', () => {
    it('should parse transaction successfully', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"action": "add_transaction", "data": {"amount": 15, "type": "expense", "category": "餐饮", "description": "中午吃面", "date": "2024-01-15"}}',
            },
          }],
        }),
      });

      const categories = [{ name: '餐饮', type: 'expense' }];
      const result = await parseNaturalLanguage('中午吃了碗面15块', categories);

      expect(result.action).toBe('add_transaction');
      expect(result.data.amount).toBe(15);
    });

    it('should handle need_more_info action', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"action": "need_more_info", "missing": ["amount"], "message": "请告诉我金额是多少？"}',
            },
          }],
        }),
      });

      const result = await parseNaturalLanguage('吃饭', []);

      expect(result.action).toBe('need_more_info');
      expect(result.missing).toContain('amount');
    });

    it('should handle non-JSON response as reply', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'This is a plain text response',
            },
          }],
        }),
      });

      const result = await parseNaturalLanguage('Hello', []);

      expect(result.action).toBe('reply');
      expect(result.message).toBe('This is a plain text response');
    });

    it('should handle error gracefully', async () => {
      getAIConfig.mockRejectedValue(new Error('Network error'));

      const result = await parseNaturalLanguage('test', []);

      expect(result.action).toBe('error');
      expect(result.message).toBe('解析失败，请重试或手动输入');
    });

    it('should handle invalid JSON response', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Invalid JSON { content',
            },
          }],
        }),
      });

      const result = await parseNaturalLanguage('test', []);

      expect(result.action).toBe('reply');
    });
  });

  describe('analyzeSpending', () => {
    it('should analyze spending successfully', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Based on your spending data, you spent most on dining.',
            },
          }],
        }),
      });

      const transactions = [
        { type: 'expense', amount: 100, category_name: '餐饮' },
      ];

      const result = await analyzeSpending(transactions, 'What did I spend most on?');

      expect(result.action).toBe('analysis');
    });

    it('should handle empty transactions', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'No transaction data available.',
            },
          }],
        }),
      });

      const result = await analyzeSpending([], 'What did I spend?');

      expect(result.action).toBe('analysis');
    });

    it('should handle error gracefully', async () => {
      getAIConfig.mockRejectedValue(new Error('API error'));

      const result = await analyzeSpending([], 'test');

      expect(result.action).toBe('error');
    });

    it('should handle mixed transaction types', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Analysis of mixed transactions',
            },
          }],
        }),
      });

      const transactions = [
        { type: 'expense', amount: 100, category_name: 'Food' },
        { type: 'income', amount: 5000, category_name: 'Salary' },
      ];

      const result = await analyzeSpending(transactions, 'Analyze my spending');

      expect(result.action).toBe('analysis');
    });
  });

  describe('getBudgetAdvice', () => {
    it('should provide budget advice successfully', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Here are some budget tips',
            },
          }],
        }),
      });

      const transactions = [{ type: 'expense', amount: 100 }];
      const result = await getBudgetAdvice(transactions);

      expect(result.action).toBe('advice');
    });

    it('should handle empty transactions', async () => {
      getAIConfig.mockResolvedValue({
        isEnabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Start tracking your expenses',
            },
          }],
        }),
      });

      const result = await getBudgetAdvice([]);

      expect(result.action).toBe('advice');
    });

    it('should handle error gracefully', async () => {
      getAIConfig.mockRejectedValue(new Error('Service unavailable'));

      const result = await getBudgetAdvice([]);

      expect(result.action).toBe('error');
    });
  });
});