// 简单测试AI API连接的脚本

// 用户提供的API key
const API_KEY = 'sk-tqlhrkjkcyrngbsxobrkavnofcekjetfkqytzwrmsfpiemfb';

async function testAIConnection() {
  console.log('测试AI API连接...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...' + API_KEY.substring(API_KEY.length - 10));
  
  try {
    // 测试硅基流动的API连接
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3.2',
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
        max_tokens: 10,
      }),
    });
    
    console.log('响应状态:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI API连接测试成功！');
      console.log('响应:', data);
    } else {
      const error = await response.text();
      console.log('❌ AI API连接测试失败:', error);
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testAIConnection();
