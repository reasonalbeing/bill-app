/**
 * CSV解析服务
 * 用于解析支付宝和微信账单CSV文件
 */

// 解析CSV文件
export const parseCSV = (csvContent) => {
  return new Promise((resolve, reject) => {
    try {
      // 处理不同编码和换行符
      const normalizedContent = csvContent
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
      
      // 使用简单的CSV解析逻辑
      const lines = normalizedContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        reject(new Error('CSV文件为空'));
        return;
      }
      
      // 解析表头
      const headers = parseCSVLine(lines[0]);
      
      // 解析数据行
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length > 0) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
      }
      
      resolve({ headers, data });
    } catch (error) {
      reject(error);
    }
  });
};

// 解析单行CSV（处理引号内的逗号）
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // 跳过下一个引号
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// 检测账单类型
export const detectBillType = (headers) => {
  const headerStr = headers.join(',').toLowerCase();
  
  // 支付宝账单特征
  if (headerStr.includes('交易号') && headerStr.includes('商家订单号')) {
    return 'alipay';
  }
  
  // 微信账单特征
  if (headerStr.includes('交易单号') && headerStr.includes('商户单号')) {
    return 'wechat';
  }
  
  return 'unknown';
};

// 解析支付宝账单
export const parseAlipayBill = (csvData) => {
  const transactions = [];
  
  csvData.forEach((row, index) => {
    try {
      // 跳过标题行和汇总行
      if (row['交易号'] === '交易号' || !row['交易号'] || row['交易号'].includes('统计')) {
        return;
      }
      
      // 解析金额（去除¥符号和逗号）
      const amountStr = (row['金额'] || row['金额(元)'] || '').replace(/[¥,]/g, '');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount)) {
        return;
      }
      
      // 解析日期时间
      const dateTimeStr = row['创建时间'] || '';
      const dateMatch = dateTimeStr.match(/(\d{4}-\d{2}-\d{2})/);
      const timeMatch = dateTimeStr.match(/(\d{2}:\d{2}:\d{2})/);
      
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      const time = timeMatch ? timeMatch[1] : '00:00:00';
      
      // 判断收支类型
      const typeStr = row['收/支'] || '';
      let type = 'expense';
      if (typeStr.includes('收入')) {
        type = 'income';
      } else if (typeStr.includes('支出')) {
        type = 'expense';
      } else {
        // 不统计或不计入（如转账）
        return;
      }
      
      // 获取交易对方和商品名称
      const counterparty = row['交易对方'] || '';
      const productName = row['商品名称'] || '';
      const description = productName || counterparty;
      
      // 获取交易状态
      const status = row['交易状态'] || '';
      if (status.includes('关闭') || status.includes('退款成功')) {
        return; // 跳过已关闭或已退款的交易
      }
      
      transactions.push({
        id: `alipay_${index}`,
        amount: Math.abs(amount),
        type,
        date,
        time,
        description: description || '支付宝交易',
        counterparty,
        platform: 'alipay',
        paymentMethod: row['收/付款方式'] || '',
        status,
        rawData: row,
      });
    } catch (error) {
      console.warn('解析支付宝账单行失败:', error);
    }
  });
  
  return transactions;
};

// 解析微信账单
export const parseWechatBill = (csvData) => {
  const transactions = [];
  
  csvData.forEach((row, index) => {
    try {
      // 跳过标题行和空行
      if (!row['交易单号'] || row['交易单号'] === '交易单号') {
        return;
      }
      
      // 解析金额（去除¥符号和逗号）
      const amountStr = (row['金额(元)'] || row['金额'] || '').replace(/[¥,]/g, '');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount)) {
        return;
      }
      
      // 解析日期时间
      const dateTimeStr = row['交易时间'] || '';
      const dateMatch = dateTimeStr.match(/(\d{4}-\d{2}-\d{2})/);
      const timeMatch = dateTimeStr.match(/(\d{2}:\d{2}:\d{2})/);
      
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      const time = timeMatch ? timeMatch[1] : '00:00:00';
      
      // 判断收支类型
      const typeStr = row['收/支'] || '';
      let type = 'expense';
      if (typeStr.includes('收入')) {
        type = 'income';
      } else if (typeStr.includes('支出')) {
        type = 'expense';
      } else {
        // 不统计（如转账）
        return;
      }
      
      // 获取交易对方和商品名称
      const counterparty = row['交易对方'] || '';
      const productName = row['商品'] || '';
      const description = productName || counterparty;
      
      // 获取交易状态
      const status = row['当前状态'] || '';
      if (status.includes('已退款') || status.includes('已撤销')) {
        return; // 跳过已退款或已撤销的交易
      }
      
      transactions.push({
        id: `wechat_${index}`,
        amount: Math.abs(amount),
        type,
        date,
        time,
        description: description || '微信交易',
        counterparty,
        platform: 'wechat',
        paymentMethod: row['支付方式'] || '',
        status,
        rawData: row,
      });
    } catch (error) {
      console.warn('解析微信账单行失败:', error);
    }
  });
  
  return transactions;
};

// 自动分类交易
export const autoCategorize = (transaction, categories) => {
  const description = (transaction.description || '').toLowerCase();
  const counterparty = (transaction.counterparty || '').toLowerCase();
  const combinedText = `${description} ${counterparty}`;
  
  // 分类关键词映射
  const categoryKeywords = {
    '餐饮': ['餐厅', '饭店', '美食', '外卖', '肯德基', '麦当劳', '星巴克', '奶茶', '咖啡', '火锅', '烧烤', '超市', '便利店', ' grocery', 'restaurant', 'food'],
    '交通': ['地铁', '公交', '打车', '滴滴', '出租车', '加油', '停车', '高速费', 'transport', 'taxi'],
    '购物': ['商场', '超市', '便利店', '京东', '淘宝', '天猫', '拼多多', '亚马逊', 'shopping', 'store'],
    '娱乐': ['电影', '游戏', 'KTV', '影院', '娱乐', 'entertainment'],
    '医疗': ['医院', '药店', '诊所', '体检', 'medical', 'pharmacy'],
    '教育': ['学费', '培训', '课程', '书籍', 'education', 'book'],
    '通讯': ['话费', '流量', '宽带', '电信', '移动', '联通', 'phone', 'internet'],
    '住房': ['房租', '水电', '物业', '燃气', 'rent', 'utility'],
  };
  
  // 匹配分类
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        const category = categories.find(c => 
          c.name.includes(categoryName) || categoryName.includes(c.name)
        );
        if (category) {
          return category.id;
        }
      }
    }
  }
  
  // 返回默认分类
  const defaultCategory = categories.find(c => c.name === '其他');
  return defaultCategory ? defaultCategory.id : null;
};

// 转换交易数据为应用格式
export const convertToAppFormat = (transactions, categories, userId) => {
  return transactions.map(t => {
    const categoryId = autoCategorize(t, categories);
    
    return {
      amount: t.amount,
      type: t.type,
      category_id: categoryId,
      date: t.date,
      time: t.time,
      description: t.description,
      platform: t.platform,
      payment_method: t.paymentMethod,
      is_imported: true,
      import_source: t.platform,
      user_id: userId,
    };
  });
};

export default {
  parseCSV,
  detectBillType,
  parseAlipayBill,
  parseWechatBill,
  autoCategorize,
  convertToAppFormat,
};