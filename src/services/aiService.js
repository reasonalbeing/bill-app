/**
 * AI服务模块
 * 用于处理AI聊天、自然语言解析和智能分析
 */

import { getAIConfig, API_PROVIDERS } from './aiConfigService';

/**
 * 发送消息到AI并获取回复
 * @param {Array} messages - 消息历史数组
 * @param {Object} options - 额外选项
 */
export const sendMessageToAI = async (messages, options = {}) => {
  try {
    const config = await getAIConfig();
    
    if (!config.isEnabled || !config.apiKey) {
      throw new Error('AI功能未启用或未配置API密钥');
    }

    const provider = API_PROVIDERS[config.provider];
    if (!provider) {
      throw new Error('未知的API提供商');
    }

    let response;
    const requestBody = buildRequestBody(config, messages, options);

    switch (config.provider) {
      case 'siliconflow':
      case 'openai':
        response = await fetch(`${config.endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(requestBody),
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
          body: JSON.stringify(requestBody),
        });
        break;

      case 'baidu':
        response = await fetch(`${config.endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
        break;

      case 'aliyun':
        response = await fetch(`${config.endpoint}/services/aigc/text-generation/generation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
        break;

      default:
        throw new Error('不支持的API提供商');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${errorText}`);
    }

    const data = await response.json();
    return parseAIResponse(config.provider, data);
  } catch (error) {
    console.error('AI请求失败:', error);
    throw error;
  }
};

/**
 * 构建请求体
 */
const buildRequestBody = (config, messages, options) => {
  const systemPrompt = options.systemPrompt || getDefaultSystemPrompt();
  
  switch (config.provider) {
    case 'siliconflow':
    case 'openai':
    case 'baidu':
      return {
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      };

    case 'anthropic':
      return {
        model: config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        system: systemPrompt,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      };

    case 'aliyun':
      return {
        model: config.model,
        input: {
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          ],
        },
        parameters: {
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        },
      };

    default:
      throw new Error('不支持的API提供商');
  }
};

/**
 * 解析AI响应
 */
const parseAIResponse = (provider, data) => {
  switch (provider) {
    case 'siliconflow':
    case 'openai':
    case 'baidu':
      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage,
      };

    case 'anthropic':
      return {
        content: data.content?.[0]?.text || '',
        usage: data.usage,
      };

    case 'aliyun':
      return {
        content: data.output?.text || '',
        usage: data.usage,
      };

    default:
      return { content: '', usage: {} };
  }
};

/**
 * 获取默认系统提示词
 */
const getDefaultSystemPrompt = () => {
  return `你是一个智能记账助手，帮助用户通过自然语言记录收支。

你的主要功能：
1. 解析用户的记账请求，提取关键信息（金额、类型、分类、描述、日期）
2. 如果信息不完整，友好地询问缺失的信息
3. 确认记账信息无误后，返回JSON格式的记账数据
4. 提供记账建议和消费分析

可用分类：
- 支出：餐饮、交通、购物、娱乐、医疗、教育、通讯、住房、其他
- 收入：工资、奖金、投资、兼职、红包、其他

响应格式：
- 正常对话：直接回复文本
- 记账确认：返回JSON格式 {"action": "add_transaction", "data": {...}}
- 需要更多信息：友好地询问

示例：
用户："中午吃了碗面15块"
回复：{"action": "add_transaction", "data": {"amount": 15, "type": "expense", "category": "餐饮", "description": "中午吃面", "date": "2024-01-15"}}`;
};

/**
 * 解析自然语言为记账数据
 * @param {string} text - 用户输入的自然语言
 * @param {Array} categories - 可用分类列表
 */
export const parseNaturalLanguage = async (text, categories) => {
  try {
    const messages = [
      { role: 'user', content: `请解析以下记账内容："${text}"` },
    ];

    const systemPrompt = `你是一个智能记账助手。请将用户的自然语言描述解析为结构化的记账数据。

可用分类：
${categories.map(c => `- ${c.type === 'expense' ? '支出' : '收入'}: ${c.name}`).join('\n')}

请分析用户输入，提取以下信息：
- amount: 金额（数字）
- type: 类型（"expense"支出 或 "income"收入）
- category: 分类名称（从可用分类中选择最匹配的）
- description: 描述（简要说明用途）
- date: 日期（格式：YYYY-MM-DD，如未指定使用今天）

如果信息完整，直接返回JSON格式：
{"action": "add_transaction", "data": {"amount": 金额, "type": "expense/income", "category": "分类名", "description": "描述", "date": "日期"}}

如果信息不完整（如缺少金额），返回：
{"action": "need_more_info", "missing": ["缺少的字段"], "message": "友好的询问信息"}

只返回JSON，不要添加其他文字。`;

    const response = await sendMessageToAI(messages, { systemPrompt });
    
    // 尝试解析JSON
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('JSON解析失败:', e);
    }

    // 如果无法解析为JSON，返回文本回复
    return {
      action: 'reply',
      message: response.content,
    };
  } catch (error) {
    console.error('自然语言解析失败:', error);
    return {
      action: 'error',
      message: '解析失败，请重试或手动输入',
    };
  }
};

/**
 * 分析消费情况
 * @param {Array} transactions - 交易记录数组
 * @param {string} question - 用户的问题
 */
export const analyzeSpending = async (transactions, question) => {
  try {
    const summary = generateTransactionSummary(transactions);
    
    const messages = [
      { role: 'user', content: `基于以下消费数据，请回答：${question}\n\n${summary}` },
    ];

    const systemPrompt = `你是一个智能财务分析师。基于用户的消费数据，提供专业的分析和建议。

分析维度：
1. 消费结构分析（各类别占比）
2. 消费习惯评估（是否健康、是否有优化空间）
3. 预算执行情况（是否超支、超支原因）
4. 节省建议（基于消费模式给出具体建议）

回答要求：
- 数据准确，基于提供的数据分析
- 建议具体可行，不要泛泛而谈
- 语气友好专业
- 适当使用表情符号增加可读性`;

    const response = await sendMessageToAI(messages, { systemPrompt });
    return {
      action: 'analysis',
      message: response.content,
    };
  } catch (error) {
    console.error('消费分析失败:', error);
    return {
      action: 'error',
      message: '分析失败，请重试',
    };
  }
};

/**
 * 生成交易数据摘要
 */
const generateTransactionSummary = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return '暂无交易数据';
  }

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const categoryStats = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const category = t.category_name || t.category || '其他';
      if (!categoryStats[category]) {
        categoryStats[category] = 0;
      }
      categoryStats[category] += parseFloat(t.amount);
    });

  const sortedCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return `消费数据摘要：
- 总支出：¥${totalExpense.toFixed(2)}
- 总收入：¥${totalIncome.toFixed(2)}
- 结余：¥${(totalIncome - totalExpense).toFixed(2)}
- 交易笔数：${transactions.length}笔

主要支出类别：
${sortedCategories.map(([name, amount]) => `- ${name}: ¥${amount.toFixed(2)}`).join('\n')}`;
};

/**
 * 获取记账建议
 * @param {Array} recentTransactions - 近期交易记录
 */
export const getBudgetAdvice = async (recentTransactions) => {
  try {
    const summary = generateTransactionSummary(recentTransactions);
    
    const messages = [
      { role: 'user', content: `基于以下消费数据，请给出预算管理建议：\n\n${summary}` },
    ];

    const systemPrompt = `你是一个预算管理专家。基于用户的消费数据，提供个性化的预算管理建议。

建议维度：
1. 当前消费是否合理
2. 哪些类别可以节省
3. 如何制定合理的预算
4. 具体的执行建议

回答要求：
- 建议具体可操作
- 考虑用户的实际消费情况
- 给出优先级排序
- 语气鼓励但不失专业`;

    const response = await sendMessageToAI(messages, { systemPrompt });
    return {
      action: 'advice',
      message: response.content,
    };
  } catch (error) {
    console.error('获取建议失败:', error);
    return {
      action: 'error',
      message: '获取建议失败，请重试',
    };
  }
};

export default {
  sendMessageToAI,
  parseNaturalLanguage,
  analyzeSpending,
  getBudgetAdvice,
};
