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
    it('should have all supported providers', () => {
      expect(API_PROVIDERS).toHaveProperty('siliconflow');
      expect(API_PROVIDERS).toHaveProperty('openai');
      expect(API_PROVIDERS).toHaveProperty('anthropic');
      expect(API_PROVIDERS).toHaveProperty('baidu');
      expect(API_PROVIDERS).toHaveProperty('aliyun');
    });

    it('should have correct structure for siliconflow', () => {
      expect(API_PROVIDERS.siliconflow).toMatchObject({
        id: 'siliconflow',
        name: '硅基流动',
        defaultEndpoint: 'https://api.siliconflow.cn/v1',
      });
      expect(API_PROVIDERS.siliconflow.models).toBeInstanceOf(Array);
      expect(API_PROVIDERS.siliconflow.models.length).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have default values', () => {
      expect(DEFAULT_CONFIG).toMatchObject({
        provider: 'siliconflow',
        apiKey: '',
        temperature: 0.7,
        maxTokens: 2000,
        isEnabled: false,
      });
    });
  });

  describe('saveAIConfig', () => {
    it('should save config successfully', async () => {
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

    it('should return error on failure', async () => {
      SecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await saveAIConfig({ provider: 'openai' });

      expect(result.success).toBe(false);
    });
  });

  describe('getAIConfig', () => {
    it('should return stored config', async () => {
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

    it('should return defaults when nothing stored', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await getAIConfig();

      expect(result.provider).toBe(DEFAULT_CONFIG.provider);
      expect(result.isEnabled).toBe(false);
    });
  });

  describe('testAPIConnection', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should return error for unknown provider', async () => {
      const result = await testAPIConnection({
        provider: 'unknown',
        apiKey: 'test-key',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('未知的API提供商');
    });

    it('should return error when apiKey is empty', async () => {
      const result = await testAPIConnection({
        provider: 'openai',
        apiKey: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API密钥不能为空');
    });
  });

  describe('getProviderInfo', () => {
    it('should return provider info for valid id', () => {
      const result = getProviderInfo('openai');
      expect(result).toEqual(API_PROVIDERS.openai);
    });

    it('should return null for invalid id', () => {
      const result = getProviderInfo('invalid');
      expect(result).toBeNull();
    });
  });

  describe('getAllProviders', () => {
    it('should return all providers as array', () => {
      const result = getAllProviders();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(Object.keys(API_PROVIDERS).length);
    });
  });
});
