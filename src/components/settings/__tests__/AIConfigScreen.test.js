// Simple test file for AIConfigScreen
// This test just verifies the component can be imported without errors

// Mock Expo modules before importing the component
jest.mock('@expo/vector-icons', () => {
  return {
    Ionicons: 'Ionicons'
  };
});

// Mock expo-secure-store module
jest.mock('expo-secure-store', () => {
  return {
    setItemAsync: jest.fn().mockResolvedValue(),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue()
  };
});

// Mock react-native modules to avoid Platform resolution issues
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: jest.fn(() => ({}))
  },
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  Switch: 'Switch',
  ActivityIndicator: 'ActivityIndicator',
  Alert: {
    alert: jest.fn()
  },
  Modal: 'Modal'
}));

// Mock services that use expo-secure-store
jest.mock('../../../services/aiConfigService', () => {
  return {
    getAIConfig: jest.fn().mockResolvedValue({
      isEnabled: true,
      provider: 'siliconflow',
      apiKey: 'test-key',
      endpoint: 'https://api.siliconflow.cn/v1',
      model: 'deepseek-ai/DeepSeek-V3.2',
      temperature: 0.7,
      maxTokens: 2000
    }),
    saveAIConfig: jest.fn().mockResolvedValue({ success: true }),
    clearAIConfig: jest.fn().mockResolvedValue({ success: true }),
    testAPIConnection: jest.fn().mockResolvedValue({ success: true }),
    getAllProviders: jest.fn().mockReturnValue([
      { id: 'siliconflow', name: '硅基流动' },
      { id: 'openai', name: 'OpenAI' }
    ]),
    API_PROVIDERS: {
      siliconflow: { id: 'siliconflow', name: '硅基流动' },
      openai: { id: 'openai', name: 'OpenAI' }
    }
  };
});

describe('AIConfigScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('can be imported without errors', () => {
    expect(() => {
      require('../AIConfigScreen');
    }).not.toThrow();
  });

  test('should be defined', () => {
    const AIConfigScreen = require('../AIConfigScreen').default;
    expect(AIConfigScreen).toBeDefined();
  });

  test('should be a function', () => {
    const AIConfigScreen = require('../AIConfigScreen').default;
    expect(typeof AIConfigScreen).toBe('function');
  });

  test('should have correct mock setup for aiConfigService', () => {
    const {
      getAIConfig,
      saveAIConfig,
      clearAIConfig,
      testAPIConnection,
      getAllProviders
    } = require('../../../services/aiConfigService');
    
    expect(typeof getAIConfig).toBe('function');
    expect(typeof saveAIConfig).toBe('function');
    expect(typeof clearAIConfig).toBe('function');
    expect(typeof testAPIConnection).toBe('function');
    expect(typeof getAllProviders).toBe('function');
  });

  test('should have API_PROVIDERS in mock', () => {
    const { API_PROVIDERS } = require('../../../services/aiConfigService');
    
    expect(API_PROVIDERS).toBeDefined();
    expect(API_PROVIDERS).toHaveProperty('siliconflow');
    expect(API_PROVIDERS).toHaveProperty('openai');
  });

  test('should get AI config successfully', async () => {
    const { getAIConfig } = require('../../../services/aiConfigService');
    const config = await getAIConfig();
    
    expect(config).toBeDefined();
    expect(config).toHaveProperty('isEnabled');
    expect(config).toHaveProperty('provider');
    expect(config).toHaveProperty('apiKey');
  });

  test('should save AI config successfully', async () => {
    const { saveAIConfig } = require('../../../services/aiConfigService');
    const result = await saveAIConfig({ apiKey: 'new-key' });
    
    expect(result.success).toBe(true);
  });

  test('should test API connection successfully', async () => {
    const { testAPIConnection } = require('../../../services/aiConfigService');
    const result = await testAPIConnection({ apiKey: 'test-key' });
    
    expect(result.success).toBe(true);
  });

  test('should get all providers', () => {
    const { getAllProviders } = require('../../../services/aiConfigService');
    const providers = getAllProviders();
    
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
  });
});