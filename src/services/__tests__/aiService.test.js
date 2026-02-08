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

    it('should handle error gracefully', async () => {
      getAIConfig.mockRejectedValue(new Error('Network error'));

      const result = await parseNaturalLanguage('test', []);

      expect(result.action).toBe('error');
      expect(result.message).toBe('解析失败，请重试或手动输入');
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

    it('should handle error gracefully', async () => {
      getAIConfig.mockRejectedValue(new Error('API error'));

      const result = await analyzeSpending([], 'test');

      expect(result.action).toBe('error');
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

    it('should handle error gracefully', async () => {
      getAIConfig.mockRejectedValue(new Error('Service unavailable'));

      const result = await getBudgetAdvice([]);

      expect(result.action).toBe('error');
    });
  });
});
