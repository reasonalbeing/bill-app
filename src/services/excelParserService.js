/**
 * Excel解析服务
 * 用于解析Excel格式的账单文件
 */

import * as XLSX from 'xlsx';

/**
 * 读取Excel文件
 * @param {string} fileUri - 文件URI
 */
export const readExcelFile = async (fileUri) => {
  try {
    const response = await fetch(fileUri);
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    return {
      success: true,
      data: jsonData,
      sheetNames: workbook.SheetNames,
    };
  } catch (error) {
    console.error('读取Excel文件失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 检测Excel账单类型
 * @param {Array} headers - 表头数组
 */
export const detectExcelBillType = (headers) => {
  const headerStr = headers.join(',').toLowerCase();
  
  // 支付宝Excel特征
  if (headerStr.includes('交易号') && headerStr.includes('商家订单号')) {
    return 'alipay';
  }
  
  // 微信Excel特征
  if (headerStr.includes('交易单号') && headerStr.includes('商户单号')) {
    return 'wechat';
  }
  
  // 银行账单特征
  if (headerStr.includes('交易日期') && headerStr.includes('交易金额')) {
    return 'bank';
  }
  
  // 通用模板
  if (headerStr.includes('日期') && headerStr.includes('金额')) {
    return 'generic';
  }
  
  return 'unknown';
};

/**
 * 解析支付宝Excel账单
 */
export const parseAlipayExcel = (data) => {
  const transactions = [];
  
  // 找到表头行（通常是第1行或第2行）
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (row && row.length > 5) {
      const rowStr = row.join(',').toLowerCase();
      if (rowStr.includes('交易号') || rowStr.includes('创建时间')) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  const headers = data[headerRowIndex] || [];
  
  // 找到关键列的索引
  const colIndex = {
    tradeNo: headers.findIndex(h => h && h.includes('交易号')),
    createTime: headers.findIndex(h => h && h.includes('创建时间')),
    counterparty: headers.findIndex(h => h && h.includes('交易对方')),
    productName: headers.findIndex(h => h && h.includes('商品名称')),
    amount: headers.findIndex(h => h && h.includes('金额')),
    type: headers.findIndex(h => h && h.includes('收/支')),
    status: headers.findIndex(h => h && h.includes('交易状态')),
    paymentMethod: headers.findIndex(h => h && h.includes('收/付款方式')),
  };
  
  // 解析数据行
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    // 跳过汇总行
    const firstCell = String(row[0] || '');
    if (firstCell.includes('统计') || firstCell.includes('合计')) continue;
    
    try {
      // 解析金额
      const amountStr = String(row[colIndex.amount] || '0').replace(/[¥,]/g, '');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount === 0) continue;
      
      // 解析日期
      const dateTimeStr = String(row[colIndex.createTime] || '');
      const dateMatch = dateTimeStr.match(/(\d{4}-\d{2}-\d{2})/);
      const timeMatch = dateTimeStr.match(/(\d{2}:\d{2}:\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      const time = timeMatch ? timeMatch[1] : '00:00:00';
      
      // 解析类型
      const typeStr = String(row[colIndex.type] || '');
      let type = 'expense';
      if (typeStr.includes('收入')) type = 'income';
      else if (typeStr.includes('支出')) type = 'expense';
      else continue; // 跳过不统计的
      
      // 解析状态
      const status = String(row[colIndex.status] || '');
      if (status.includes('关闭') || status.includes('退款成功')) continue;
      
      // 获取描述
      const counterparty = String(row[colIndex.counterparty] || '');
      const productName = String(row[colIndex.productName] || '');
      const description = productName || counterparty || '支付宝交易';
      
      transactions.push({
        id: `alipay_excel_${i}`,
        amount: Math.abs(amount),
        type,
        date,
        time,
        description,
        counterparty,
        platform: 'alipay',
        paymentMethod: String(row[colIndex.paymentMethod] || ''),
        status,
        tradeNo: String(row[colIndex.tradeNo] || ''),
      });
    } catch (error) {
      console.warn(`解析第${i}行失败:`, error);
    }
  }
  
  return transactions;
};

/**
 * 解析微信Excel账单
 */
export const parseWechatExcel = (data) => {
  const transactions = [];
  
  // 找到表头行
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (row && row.length > 5) {
      const rowStr = row.join(',').toLowerCase();
      if (rowStr.includes('交易单号') || rowStr.includes('交易时间')) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  const headers = data[headerRowIndex] || [];
  
  // 找到关键列的索引
  const colIndex = {
    tradeNo: headers.findIndex(h => h && h.includes('交易单号')),
    createTime: headers.findIndex(h => h && h.includes('交易时间')),
    counterparty: headers.findIndex(h => h && h.includes('交易对方')),
    productName: headers.findIndex(h => h && h.includes('商品')),
    amount: headers.findIndex(h => h && h.includes('金额')),
    type: headers.findIndex(h => h && h.includes('收/支')),
    status: headers.findIndex(h => h && h.includes('当前状态')),
    paymentMethod: headers.findIndex(h => h && h.includes('支付方式')),
  };
  
  // 解析数据行
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    // 跳过汇总行
    const firstCell = String(row[0] || '');
    if (firstCell.includes('统计') || firstCell.includes('合计')) continue;
    
    try {
      // 解析金额
      const amountStr = String(row[colIndex.amount] || '0').replace(/[¥,]/g, '');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount === 0) continue;
      
      // 解析日期
      const dateTimeStr = String(row[colIndex.createTime] || '');
      const dateMatch = dateTimeStr.match(/(\d{4}-\d{2}-\d{2})/);
      const timeMatch = dateTimeStr.match(/(\d{2}:\d{2}:\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      const time = timeMatch ? timeMatch[1] : '00:00:00';
      
      // 解析类型
      const typeStr = String(row[colIndex.type] || '');
      let type = 'expense';
      if (typeStr.includes('收入')) type = 'income';
      else if (typeStr.includes('支出')) type = 'expense';
      else continue;
      
      // 解析状态
      const status = String(row[colIndex.status] || '');
      if (status.includes('已退款') || status.includes('已撤销')) continue;
      
      // 获取描述
      const counterparty = String(row[colIndex.counterparty] || '');
      const productName = String(row[colIndex.productName] || '');
      const description = productName || counterparty || '微信交易';
      
      transactions.push({
        id: `wechat_excel_${i}`,
        amount: Math.abs(amount),
        type,
        date,
        time,
        description,
        counterparty,
        platform: 'wechat',
        paymentMethod: String(row[colIndex.paymentMethod] || ''),
        status,
        tradeNo: String(row[colIndex.tradeNo] || ''),
      });
    } catch (error) {
      console.warn(`解析第${i}行失败:`, error);
    }
  }
  
  return transactions;
};

/**
 * 解析通用Excel模板
 */
export const parseGenericExcel = (data) => {
  const transactions = [];
  
  // 找到表头行
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (row && row.length >= 3) {
      const rowStr = row.join(',').toLowerCase();
      if (rowStr.includes('日期') && rowStr.includes('金额')) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  const headers = data[headerRowIndex] || [];
  
  // 找到关键列的索引
  const colIndex = {
    date: headers.findIndex(h => h && (h.includes('日期') || h.includes('时间'))),
    amount: headers.findIndex(h => h && h.includes('金额')),
    type: headers.findIndex(h => h && (h.includes('类型') || h.includes('收支'))),
    description: headers.findIndex(h => h && (h.includes('描述') || h.includes('备注') || h.includes('说明'))),
    category: headers.findIndex(h => h && h.includes('分类')),
  };
  
  // 解析数据行
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    try {
      // 解析金额
      const amountStr = String(row[colIndex.amount] || '0').replace(/[¥,]/g, '');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount === 0) continue;
      
      // 解析日期
      let date = new Date().toISOString().split('T')[0];
      const dateCell = row[colIndex.date];
      if (dateCell) {
        if (typeof dateCell === 'number') {
          // Excel日期序列号
          const excelEpoch = new Date(1899, 11, 30);
          const parsedDate = new Date(excelEpoch.getTime() + dateCell * 24 * 60 * 60 * 1000);
          date = parsedDate.toISOString().split('T')[0];
        } else {
          const dateMatch = String(dateCell).match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) date = dateMatch[1];
        }
      }
      
      // 解析类型
      const typeStr = String(row[colIndex.type] || '').toLowerCase();
      let type = 'expense';
      if (typeStr.includes('收入') || typeStr.includes('income')) type = 'income';
      else if (typeStr.includes('支出') || typeStr.includes('expense')) type = 'expense';
      
      // 获取描述
      const description = String(row[colIndex.description] || '交易');
      const category = String(row[colIndex.category] || '');
      
      transactions.push({
        id: `generic_excel_${i}`,
        amount: Math.abs(amount),
        type,
        date,
        description,
        categoryHint: category,
        platform: 'other',
      });
    } catch (error) {
      console.warn(`解析第${i}行失败:`, error);
    }
  }
  
  return transactions;
};

/**
 * 解析Excel账单
 * @param {string} fileUri - 文件URI
 */
export const parseExcelBill = async (fileUri) => {
  try {
    const result = await readExcelFile(fileUri);
    
    if (!result.success) {
      return result;
    }
    
    const data = result.data;
    if (!data || data.length === 0) {
      return { success: false, error: 'Excel文件为空' };
    }
    
    // 检测账单类型
    const headers = data[0] || [];
    const billType = detectExcelBillType(headers);
    
    if (billType === 'unknown') {
      // 尝试第二行
      const headers2 = data[1] || [];
      const billType2 = detectExcelBillType(headers2);
      if (billType2 !== 'unknown') {
        return parseExcelByType(billType2, data);
      }
    }
    
    return parseExcelByType(billType, data);
  } catch (error) {
    console.error('解析Excel账单失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 根据类型解析Excel
 */
const parseExcelByType = (billType, data) => {
  let transactions = [];
  
  switch (billType) {
    case 'alipay':
      transactions = parseAlipayExcel(data);
      break;
    case 'wechat':
      transactions = parseWechatExcel(data);
      break;
    case 'bank':
    case 'generic':
      transactions = parseGenericExcel(data);
      break;
    default:
      // 尝试通用解析
      transactions = parseGenericExcel(data);
      break;
  }
  
  if (transactions.length === 0) {
    return { success: false, error: '未找到有效的交易记录' };
  }
  
  return {
    success: true,
    billType,
    transactions,
    count: transactions.length,
  };
};

/**
 * 导出数据为Excel
 * @param {Array} transactions - 交易记录数组
 * @param {string} fileName - 文件名
 */
export const exportToExcel = async (transactions, fileName = null) => {
  try {
    if (!transactions || transactions.length === 0) {
      throw new Error('没有可导出的数据');
    }
    
    // 准备数据
    const headers = ['日期', '时间', '类型', '金额', '分类', '描述', '支付方式', '平台', '标签'];
    const data = transactions.map(t => [
      t.date,
      t.time || '',
      t.type === 'expense' ? '支出' : '收入',
      t.amount,
      t.category_name || t.category || '',
      t.description || '',
      t.payment_method || '',
      t.platform || '',
      t.tags || '',
    ]);
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 8 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '账单数据');
    
    // 生成文件
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFileName = fileName || `账单导出_${timestamp}.xlsx`;
    
    // 在React Native中，我们需要使用不同的方式保存文件
    // 这里返回工作簿数据，由调用方处理保存
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    
    return {
      success: true,
      fileName: finalFileName,
      data: wbout,
    };
  } catch (error) {
    console.error('导出Excel失败:', error);
    return { success: false, error: error.message };
  }
};

export default {
  readExcelFile,
  detectExcelBillType,
  parseAlipayExcel,
  parseWechatExcel,
  parseGenericExcel,
  parseExcelBill,
  exportToExcel,
};
