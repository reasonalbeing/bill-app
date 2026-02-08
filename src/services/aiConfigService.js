/**
 * AI配置服务
 * 用于管理AI API配置的安全存储和读取
 */

import * as SecureStore from 'expo-secure-store';

// 存储键名
const STORAGE_KEYS = {
  API_PROVIDER: 'ai_api_provider',
  API_KEY: 'ai_api_key',
  API_ENDPOINT: 'ai_api_endpoint',
  MODEL_NAME: 'ai_model_name',
  TEMPERATURE: 'ai_temperature',
  MAX_TOKENS: 'ai_max_tokens',
  IS_ENABLED: 'ai_is_enabled',
};

// 支持的API提供商配置
export const API_PROVIDERS = {
  siliconflow: {
    id: 'siliconflow',
    name: '硅基流动',
    icon: 'cloud',
    color: '#1677FF',
    defaultEndpoint: 'https://api.siliconflow.cn/v1',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek V3.2' },
      { id: 'deepseek-ai/DeepSeek-V2.5', name: 'DeepSeek V2.5' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5 72B' },
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B' },
    ],
    description: '支持DeepSeek等开源模型，性价比高',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: 'logo-openai',
    color: '#10A37F',
    defaultEndpoint: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    description: 'OpenAI官方API，效果稳定',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    icon: 'sparkles',
    color: '#D4A574',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    ],
    description: 'Claude系列模型，长文本处理能力强',
  },
  baidu: {
    id: 'baidu',
    name: '百度',
    icon: 'logo-baidu',
    color: '#2932E1',
    defaultEndpoint: 'https://qianfan.baidubce.com/v2',
    models: [
      { id: 'ernie-4.0-turbo-8k', name: '文心一言 4.0' },
      { id: 'ernie-3.5-8k', name: '文心一言 3.5' },
      { id: 'ernie-speed-128k', name: '文心 Speed' },
    ],
    description: '百度文心一言，中文理解能力强',
  },
  aliyun: {
    id: 'aliyun',
    name: '阿里云',
    icon: 'cloud-circle',
    color: '#FF6A00',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/api/v1',
    models: [
      { id: 'qwen-max', name: '通义千问 Max' },
      { id: 'qwen-plus', name: '通义千问 Plus' },
      { id: 'qwen-turbo', name: '通义千问 Turbo' },
    ],
    description: '阿里云通义千问，国内访问稳定',
  },
};

// 默认配置
export const DEFAULT_CONFIG = {
  provider: 'siliconflow',
  apiKey: '',
  endpoint: API_PROVIDERS.siliconflow.defaultEndpoint,
  model: API_PROVIDERS.siliconflow.models[0].id,
  temperature: 0.7,
  maxTokens: 2000,
  isEnabled: false,
};

/**
 * 保存AI配置
 * @param {Object} config - 配置对象
 */
export const saveAIConfig = async (config) => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.API_PROVIDER, config.provider || DEFAULT_CONFIG.provider);
    await SecureStore.setItemAsync(STORAGE_KEYS.API_KEY, config.apiKey || '');
    await SecureStore.setItemAsync(STORAGE_KEYS.API_ENDPOINT, config.endpoint || '');
    await SecureStore.setItemAsync(STORAGE_KEYS.MODEL_NAME, config.model || '');
    await SecureStore.setItemAsync(STORAGE_KEYS.TEMPERATURE, String(config.temperature ?? DEFAULT_CONFIG.temperature));
    await SecureStore.setItemAsync(STORAGE_KEYS.MAX_TOKENS, String(config.maxTokens ?? DEFAULT_CONFIG.maxTokens));
    await SecureStore.setItemAsync(STORAGE_KEYS.IS_ENABLED, String(config.isEnabled ?? false));
    return { success: true };
  } catch (error) {
    console.error('保存AI配置失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 获取AI配置
 * @returns {Object} 配置对象
 */
export const getAIConfig = async () => {
  try {
    const provider = await SecureStore.getItemAsync(STORAGE_KEYS.API_PROVIDER);
    const apiKey = await SecureStore.getItemAsync(STORAGE_KEYS.API_KEY);
    const endpoint = await SecureStore.getItemAsync(STORAGE_KEYS.API_ENDPOINT);
    const model = await SecureStore.getItemAsync(STORAGE_KEYS.MODEL_NAME);
    const temperature = await SecureStore.getItemAsync(STORAGE_KEYS.TEMPERATURE);
    const maxTokens = await SecureStore.getItemAsync(STORAGE_KEYS.MAX_TOKENS);
    const isEnabled = await SecureStore.getItemAsync(STORAGE_KEYS.IS_ENABLED);

    return {
      provider: provider || DEFAULT_CONFIG.provider,
      apiKey: apiKey || '',
      endpoint: endpoint || API_PROVIDERS[provider]?.defaultEndpoint || DEFAULT_CONFIG.endpoint,
      model: model || API_PROVIDERS[provider]?.models[0]?.id || DEFAULT_CONFIG.model,
      temperature: parseFloat(temperature) || DEFAULT_CONFIG.temperature,
      maxTokens: parseInt(maxTokens) || DEFAULT_CONFIG.maxTokens,
      isEnabled: isEnabled === 'true',
    };
  } catch (error) {
    console.error('获取AI配置失败:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * 清除AI配置
 */
export const clearAIConfig = async () => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.API_PROVIDER);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.API_KEY);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.API_ENDPOINT);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.MODEL_NAME);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TEMPERATURE);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.MAX_TOKENS);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.IS_ENABLED);
    return { success: true };
  } catch (error) {
    console.error('清除AI配置失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 测试API连接
 * @param {Object} config - 配置对象
 */
export const testAPIConnection = async (config) => {
  try {
    const provider = API_PROVIDERS[config.provider];
    if (!provider) {
      throw new Error('未知的API提供商');
    }

    if (!config.apiKey) {
      throw new Error('API密钥不能为空');
    }

    // 构建测试请求
    const testMessage = 'Hello, this is a test message.';
    let response;

    switch (config.provider) {
      case 'siliconflow':
      case 'openai':
        response = await fetch(`${config.endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: testMessage }],
            max_tokens: 10,
          }),
        });
        break;

      case 'anthropic':
        response = await fetch(`${config.endpoint}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: testMessage }],
            max_tokens: 10,
          }),
        });
        break;

      case 'baidu':
        response = await fetch(`${config.endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: testMessage }],
          }),
        });
        break;

      case 'aliyun':
        response = await fetch(`${config.endpoint}/services/aigc/text-generation/generation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            input: {
              messages: [{ role: 'user', content: testMessage }],
            },
            parameters: {
              max_tokens: 10,
            },
          }),
        });
        break;

      default:
        throw new Error('不支持的API提供商');
    }

    if (response.ok) {
      return { success: true, message: '连接成功' };
    } else {
      const error = await response.text();
      throw new Error(`API错误: ${error}`);
    }
  } catch (error) {
    console.error('测试API连接失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 获取API提供商信息
 * @param {string} providerId - 提供商ID
 */
export const getProviderInfo = (providerId) => {
  return API_PROVIDERS[providerId] || null;
};

/**
 * 获取所有支持的API提供商
 */
export const getAllProviders = () => {
  return Object.values(API_PROVIDERS);
};

export default {
  API_PROVIDERS,
  DEFAULT_CONFIG,
  saveAIConfig,
  getAIConfig,
  clearAIConfig,
  testAPIConnection,
  getProviderInfo,
  getAllProviders,
};
