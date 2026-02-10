import {
  API_PROVIDERS,
  DEFAULT_CONFIG,
  saveAIConfig,
  getAIConfig,
  clearAIConfig,
  testAPIConnection,
  getProviderInfo,
  getAllProviders,
} from '../aiConfigService';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

describe('aiConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API_PROVIDERS', () => {
    test('should have all supported providers', () => {
      expect(API_PROVIDERS).toHaveProperty('siliconflow');
      expect(API_PROVIDERS).toHaveProperty('openai');
      expect(API_PROVIDERS).toHaveProperty('anthropic');
      expect(API_PROVIDERS).toHaveProperty('baidu');
      expect(API_PROVIDERS).toHaveProperty('aliyun');
    });

    test('should have correct structure for siliconflow', () => {
      expect(API_PROVIDERS.siliconflow).toMatchObject({
        id: 'siliconflow',
        name: '硅基流动',
        defaultEndpoint: 'https://api.siliconflow.cn/v1',
      });
      expect(API_PROVIDERS.siliconflow.models).toBeInstanceOf(Array);
      expect(API_PROVIDERS.siliconflow.models.length).toBeGreaterThan(0);
    });

    test('should have correct structure for all providers', () => {
      Object.values(API_PROVIDERS).forEach(provider => {
        expect(provider).toHaveProperty('id');
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('defaultEndpoint');
        expect(provider).toHaveProperty('models');
        expect(provider.models).toBeInstanceOf(Array);
        expect(provider.models.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_CONFIG', () => {
    test('should have default values', () => {
      expect(DEFAULT_CONFIG).toMatchObject({
        provider: 'siliconflow',
        apiKey: '',
        temperature: 0.7,
        maxTokens: 2000,
        isEnabled: false,
      });
    });

    test('should have correct default endpoint', () => {
      expect(DEFAULT_CONFIG.endpoint).toBe(API_PROVIDERS.siliconflow.defaultEndpoint);
    });

    test('should have correct default model', () => {
      expect(DEFAULT_CONFIG.model).toBe(API_PROVIDERS.siliconflow.models[0].id);
    });
  });

  describe('saveAIConfig', () => {
    test('should save config successfully', async () => {
      SecureStore.setItemAsync.mockResolvedValue();

      const config = {
        provider: 'openai',
        apiKey: 'test-api-key',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 1000,
        isEnabled: true,
      };

      const result = await saveAIConfig(config);

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(7);
      expect(result.success).toBe(true);
    });

    test('should return error on failure', async () => {
      SecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await saveAIConfig({ provider: 'openai' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
    });

    test('should use default values when not provided', async () => {
      SecureStore.setItemAsync.mockResolvedValue();

      const config = {
        provider: 'openai',
        // Other fields not provided
      };

      await saveAIConfig(config);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ai_api_provider', 'openai');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ai_api_key', '');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ai_temperature', String(DEFAULT_CONFIG.temperature));
    });
  });

  describe('getAIConfig', () => {
    test('should return stored config', async () => {
      SecureStore.getItemAsync
        .mockResolvedValueOnce('openai')
        .mockResolvedValueOnce('test-key')
        .mockResolvedValueOnce('https://api.openai.com/v1')
        .mockResolvedValueOnce('gpt-4')
        .mockResolvedValueOnce('0.8')
        .mockResolvedValueOnce('1500')
        .mockResolvedValueOnce('true');

      const result = await getAIConfig();

      expect(result.provider).toBe('openai');
      expect(result.apiKey).toBe('test-key');
      expect(result.isEnabled).toBe(true);
    });

    test('should return defaults when nothing stored', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await getAIConfig();

      expect(result.provider).toBe(DEFAULT_CONFIG.provider);
      expect(result.isEnabled).toBe(false);
    });

    test('should handle error and return defaults', async () => {
      SecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await getAIConfig();

      expect(result).toEqual(DEFAULT_CONFIG);
    });

    test('should handle partial config', async () => {
      SecureStore.getItemAsync
        .mockResolvedValueOnce('baidu')
        .mockResolvedValueOnce('test-key')
        .mockResolvedValueOnce(null) // No endpoint
        .mockResolvedValueOnce(null) // No model
        .mockResolvedValueOnce(null) // No temperature
        .mockResolvedValueOnce(null) // No maxTokens
        .mockResolvedValueOnce(null); // No isEnabled

      const result = await getAIConfig();

      expect(result.provider).toBe('baidu');
      expect(result.apiKey).toBe('test-key');
      expect(result.endpoint).toBe(API_PROVIDERS.baidu.defaultEndpoint);
      expect(result.model).toBe(API_PROVIDERS.baidu.models[0].id);
      expect(result.temperature).toBe(DEFAULT_CONFIG.temperature);
      expect(result.maxTokens).toBe(DEFAULT_CONFIG.maxTokens);
      expect(result.isEnabled).toBe(false);
    });
  });

  describe('clearAIConfig', () => {
    test('should clear config successfully', async () => {
      SecureStore.deleteItemAsync.mockResolvedValue();

      const result = await clearAIConfig();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(7);
      expect(result.success).toBe(true);
    });

    test('should return error on failure', async () => {
      SecureStore.deleteItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await clearAIConfig();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
    });
  });

  describe('testAPIConnection', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('should return error for unknown provider', async () => {
      const result = await testAPIConnection({
        provider: 'unknown',
        apiKey: 'test-key',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('未知的API提供商');
    });

    test('should return error when apiKey is empty', async () => {
      const result = await testAPIConnection({
        provider: 'openai',
        apiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API密钥不能为空');
    });

    test('should test siliconflow connection successfully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('Success'),
      });

      const result = await testAPIConnection({
        provider: 'siliconflow',
        apiKey: 'test-key',
        endpoint: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-V3.2',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('连接成功');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.siliconflow.cn/v1/chat/completions',
        expect.any(Object)
      );
    });

    test('should test openai connection successfully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('Success'),
      });

      const result = await testAPIConnection({
        provider: 'openai',
        apiKey: 'test-key',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object)
      );
    });

    test('should test anthropic connection successfully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('Success'),
      });

      const result = await testAPIConnection({
        provider: 'anthropic',
        apiKey: 'test-key',
        endpoint: 'https://api.anthropic.com/v1',
        model: 'claude-3-sonnet-20240229',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.any(Object)
      );
    });

    test('should test baidu connection successfully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('Success'),
      });

      const result = await testAPIConnection({
        provider: 'baidu',
        apiKey: 'test-key',
        endpoint: 'https://qianfan.baidubce.com/v2',
        model: 'ernie-4.0-turbo-8k',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://qianfan.baidubce.com/v2/chat/completions',
        expect.any(Object)
      );
    });

    test('should test aliyun connection successfully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('Success'),
      });

      const result = await testAPIConnection({
        provider: 'aliyun',
        apiKey: 'test-key',
        endpoint: 'https://dashscope.aliyuncs.com/api/v1',
        model: 'qwen-max',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        expect.any(Object)
      );
    });

    test('should handle API error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue('API Error'),
      });

      const result = await testAPIConnection({
        provider: 'openai',
        apiKey: 'test-key',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API错误');
    });

    test('should handle network error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await testAPIConnection({
        provider: 'openai',
        apiKey: 'test-key',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getProviderInfo', () => {
    test('should return provider info for valid id', () => {
      const result = getProviderInfo('openai');
      expect(result).toEqual(API_PROVIDERS.openai);
    });

    test('should return null for invalid id', () => {
      const result = getProviderInfo('invalid');
      expect(result).toBeNull();
    });

    test('should return null for empty id', () => {
      const result = getProviderInfo('');
      expect(result).toBeNull();
    });
  });

  describe('getAllProviders', () => {
    test('should return all providers as array', () => {
      const result = getAllProviders();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(Object.keys(API_PROVIDERS).length);
    });

    test('should return providers with correct structure', () => {
      const providers = getAllProviders();
      providers.forEach(provider => {
        expect(provider).toHaveProperty('id');
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('models');
      });
    });
  });
});
