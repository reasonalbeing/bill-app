// 测试AI API连接的脚本

// 模拟expo-secure-store，避免在Node.js环境中的依赖问题
const mockSecureStore = {
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
};

// 模拟expo-secure-store模块
jest.mock('expo-secure-store', () => mockSecureStore);

// 导入测试函数
const { testAPIConnection } = require('./src/services/aiConfigService');

// 用户提供的API key
const API_KEY = 'sk-tqlhrkjkcyrngbsxobrkavnofcekjetfkqytzwrmsfpiemfb';

async function testAIConnection() {
  console.log('测试AI API连接...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...' + API_KEY.substring(API_KEY.length - 10));
  
  try {
    // 测试硅基流动的API连接
    const result = await testAPIConnection({
      provider: 'siliconflow',
      apiKey: API_KEY,
      endpoint: 'https://api.siliconflow.cn/v1',
      model: 'deepseek-ai/DeepSeek-V3.2',
    });
    
    console.log('测试结果:', result);
    
    if (result.success) {
      console.log('✅ AI API连接测试成功！');
    } else {
      console.log('❌ AI API连接测试失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testAIConnection();
