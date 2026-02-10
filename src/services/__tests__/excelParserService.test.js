import {
  readExcelFile,
  detectExcelBillType,
  parseAlipayExcel,
  parseWechatExcel,
  parseGenericExcel,
  parseExcelBill,
  exportToExcel,
} from '../excelParserService';
import * as XLSX from 'xlsx';

// Mock dependencies
jest.mock('xlsx');
global.fetch = jest.fn();

const mockXLSX = XLSX;

describe('excelParserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readExcelFile', () => {
    test('should read Excel file successfully', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockWorkbook = {
        Sheets: {
          'Sheet1': { A1: { v: 'Header1' } },
        },
        SheetNames: ['Sheet1'],
      };

      global.fetch.mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      });

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue([['Header1', 'Header2']]);

      const result = await readExcelFile('file:///test.xlsx');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([['Header1', 'Header2']]);
      expect(result.sheetNames).toEqual(['Sheet1']);
    });

    test('should handle error when reading Excel file', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await readExcelFile('file:///test.xlsx');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('detectExcelBillType', () => {
    test('should detect alipay bill type', () => {
      const headers = ['交易号', '商家订单号', '金额'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('alipay');
    });

    test('should detect wechat bill type', () => {
      const headers = ['交易单号', '商户单号', '金额'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('wechat');
    });

    test('should detect bank bill type', () => {
      const headers = ['交易日期', '交易金额', '交易类型'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('bank');
    });

    test('should detect generic bill type', () => {
      const headers = ['日期', '金额', '描述'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('generic');
    });

    test('should return unknown for unknown bill type', () => {
      const headers = ['列1', '列2', '列3'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('unknown');
    });

    test('should return unknown for empty headers', () => {
      const headers = [];
      const result = detectExcelBillType(headers);
      expect(result).toBe('unknown');
    });
  });

  describe('parseAlipayExcel', () => {
    test('should parse alipay Excel successfully', () => {
      const data = [
        ['交易号', '创建时间', '交易对方', '商品名称', '金额', '收/支', '交易状态', '收/付款方式'],
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '¥25.00', '支出', '交易成功', '支付宝余额'],
        ['20240101654321', '2024-01-01 13:00:00', '李四', '工资', '¥5000.00', '收入', '交易成功', '银行卡'],
      ];
      
      const result = parseAlipayExcel(data);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'alipay_excel_1',
        amount: 25,
        type: 'expense',
        date: '2024-01-01',
        time: '12:00:00',
        description: '午餐',
        counterparty: '张三',
        platform: 'alipay',
        paymentMethod: '支付宝余额',
        status: '交易成功',
        tradeNo: '20240101123456',
      });
      expect(result[1]).toEqual({
        id: 'alipay_excel_2',
        amount: 5000,
        type: 'income',
        date: '2024-01-01',
        time: '13:00:00',
        description: '工资',
        counterparty: '李四',
        platform: 'alipay',
        paymentMethod: '银行卡',
        status: '交易成功',
        tradeNo: '20240101654321',
      });
    });

    test('should skip invalid rows in alipay Excel', () => {
      const data = [
        ['交易号', '创建时间', '交易对方', '商品名称', '金额', '收/支', '交易状态', '收/付款方式'],
        ['', '', '', '', '', '', '', ''], // Empty row
        ['统计', '汇总', '', '', '', '', '', ''], // Summary row
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '¥25.00', '支出', '交易成功', '支付宝余额'],
      ];
      
      const result = parseAlipayExcel(data);
      
      expect(result).toHaveLength(1);
    });

    test('should skip refunded transactions in alipay Excel', () => {
      const data = [
        ['交易号', '创建时间', '交易对方', '商品名称', '金额', '收/支', '交易状态', '收/付款方式'],
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '¥25.00', '支出', '退款成功', '支付宝余额'],
      ];
      
      const result = parseAlipayExcel(data);
      
      expect(result).toHaveLength(0);
    });

    test('should skip zero amount transactions in alipay Excel', () => {
      const data = [
        ['交易号', '创建时间', '交易对方', '商品名称', '金额', '收/支', '交易状态', '收/付款方式'],
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '¥0.00', '支出', '交易成功', '支付宝余额'],
      ];
      
      const result = parseAlipayExcel(data);
      
      expect(result).toHaveLength(0);
    });

    test('should handle missing header row in alipay Excel', () => {
      const data = [
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '¥25.00', '支出', '交易成功', '支付宝余额'],
      ];
      
      const result = parseAlipayExcel(data);
      
      expect(result).toHaveLength(0);
    });

    test('should handle parsing errors in alipay Excel', () => {
      const data = [
        ['交易号', '创建时间', '交易对方', '商品名称', '金额', '收/支', '交易状态', '收/付款方式'],
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '无效金额', '支出', '交易成功', '支付宝余额'],
      ];
      
      const result = parseAlipayExcel(data);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('parseWechatExcel', () => {
    test('should parse wechat Excel successfully', () => {
      const data = [
        ['交易单号', '交易时间', '交易对方', '商品', '金额', '收/支', '当前状态', '支付方式'],
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '¥25.00', '支出', '已完成', '微信余额'],
        ['20240101654321', '2024-01-01 13:00:00', '李四', '工资', '¥5000.00', '收入', '已完成', '银行卡'],
      ];
      
      const result = parseWechatExcel(data);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'wechat_excel_1',
        amount: 25,
        type: 'expense',
        date: '2024-01-01',
        time: '12:00:00',
        description: '午餐',
        counterparty: '张三',
        platform: 'wechat',
        paymentMethod: '微信余额',
        status: '已完成',
        tradeNo: '20240101123456',
      });
      expect(result[1]).toEqual({
        id: 'wechat_excel_2',
        amount: 5000,
        type: 'income',
        date: '2024-01-01',
        time: '13:00:00',
        description: '工资',
        counterparty: '李四',
        platform: 'wechat',
        paymentMethod: '银行卡',
        status: '已完成',
        tradeNo: '20240101654321',
      });
    });

    test('should skip refunded transactions in wechat Excel', () => {
      const data = [
        ['交易单号', '交易时间', '交易对方', '商品', '金额', '收/支', '当前状态', '支付方式'],
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '¥25.00', '支出', '已退款', '微信余额'],
      ];
      
      const result = parseWechatExcel(data);
      
      expect(result).toHaveLength(0);
    });

    test('should skip invalid rows in wechat Excel', () => {
      const data = [
        ['交易单号', '交易时间', '交易对方', '商品', '金额', '收/支', '当前状态', '支付方式'],
        ['', '', '', '', '', '', '', ''], // Empty row
        ['统计', '汇总', '', '', '', '', '', ''], // Summary row
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '¥25.00', '支出', '已完成', '微信余额'],
      ];
      
      const result = parseWechatExcel(data);
      
      expect(result).toHaveLength(1);
    });

    test('should handle parsing errors in wechat Excel', () => {
      const data = [
        ['交易单号', '交易时间', '交易对方', '商品', '金额', '收/支', '当前状态', '支付方式'],
        ['20240101123456', '2024-01-01 12:00:00', '张三', '午餐', '无效金额', '支出', '已完成', '微信余额'],
      ];
      
      const result = parseWechatExcel(data);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('parseGenericExcel', () => {
    test('should parse generic Excel successfully', () => {
      const data = [
        ['日期', '金额', '类型', '描述', '分类'],
        ['2024-01-01', '100', '支出', '午餐', '餐饮'],
        ['2024-01-02', '5000', '收入', '工资', '工资'],
      ];
      
      const result = parseGenericExcel(data);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'generic_excel_1',
        amount: 100,
        type: 'expense',
        date: '2024-01-01',
        description: '午餐',
        categoryHint: '餐饮',
        platform: 'other',
      });
      expect(result[1]).toEqual({
        id: 'generic_excel_2',
        amount: 5000,
        type: 'income',
        date: '2024-01-02',
        description: '工资',
        categoryHint: '工资',
        platform: 'other',
      });
    });

    test('should parse Excel date serial numbers', () => {
      const data = [
        ['日期', '金额', '类型', '描述'],
        [45266, '100', '支出', '午餐'], // Excel date for 2024-01-01
      ];
      
      const result = parseGenericExcel(data);
      
      expect(result).toHaveLength(1);
      expect(result[0].date).toBeDefined();
    });

    test('should handle missing date in generic Excel', () => {
      const data = [
        ['金额', '类型', '描述'],
        ['100', '支出', '午餐'],
      ];
      
      const result = parseGenericExcel(data);
      
      expect(result).toHaveLength(1);
      expect(result[0].date).toBeDefined();
    });

    test('should skip zero amount transactions in generic Excel', () => {
      const data = [
        ['日期', '金额', '类型', '描述'],
        ['2024-01-01', '0', '支出', '午餐'],
      ];
      
      const result = parseGenericExcel(data);
      
      expect(result).toHaveLength(0);
    });

    test('should handle parsing errors in generic Excel', () => {
      const data = [
        ['日期', '金额', '类型', '描述'],
        ['2024-01-01', '无效金额', '支出', '午餐'],
      ];
      
      const result = parseGenericExcel(data);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('parseExcelBill', () => {
    test('should parse alipay Excel bill successfully', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockWorkbook = {
        Sheets: {
          'Sheet1': { A1: { v: '交易号' } },
        },
        SheetNames: ['Sheet1'],
      };

      global.fetch.mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      });

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue([
        ['交易号', '商家订单号', '创建时间', '交易对方', '商品名称', '金额', '收/支', '交易状态', '收/付款方式'],
        ['20240101123456', 'ORD123', '2024-01-01 12:00:00', '张三', '午餐', '¥25.00', '支出', '交易成功', '支付宝余额'],
      ]);

      const result = await parseExcelBill('file:///test.xlsx');

      expect(result.success).toBe(true);
      expect(result.billType).toBe('alipay');
      expect(result.transactions).toBeInstanceOf(Array);
    });

    test('should parse wechat Excel bill successfully', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockWorkbook = {
        Sheets: {
          'Sheet1': { A1: { v: '交易单号' } },
        },
        SheetNames: ['Sheet1'],
      };

      global.fetch.mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      });

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue([
        ['交易单号', '商户单号', '交易时间', '交易对方', '商品', '金额', '收/支', '当前状态', '支付方式'],
        ['20240101123456', '商户123456', '2024-01-01 12:00:00', '张三', '午餐', '¥25.00', '支出', '已完成', '微信余额'],
      ]);

      const result = await parseExcelBill('file:///test.xlsx');

      expect(result.success).toBe(true);
      expect(result.billType).toBe('wechat');
    });

    test('should handle empty Excel file', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockWorkbook = {
        Sheets: {
          'Sheet1': {},
        },
        SheetNames: ['Sheet1'],
      };

      global.fetch.mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      });

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue([]);

      const result = await parseExcelBill('file:///test.xlsx');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Excel文件为空');
    });

    test('should handle unknown bill type', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockWorkbook = {
        Sheets: {
          'Sheet1': { A1: { v: '列1' } },
        },
        SheetNames: ['Sheet1'],
      };

      global.fetch.mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      });

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue([
        ['列1', '列2', '列3'],
        ['数据1', '数据2', '数据3'],
      ]);

      const result = await parseExcelBill('file:///test.xlsx');

      expect(result.success).toBe(false);
      expect(result.error).toBe('未找到有效的交易记录');
    });

    test('should handle error when reading Excel file', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await parseExcelBill('file:///test.xlsx');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('exportToExcel', () => {
    test('should export to Excel successfully', async () => {
      const transactions = [
        {
          date: '2024-01-01',
          time: '12:00:00',
          amount: 100,
          type: 'expense',
          category_name: '餐饮',
          description: '午餐',
          payment_method: '支付宝',
          platform: 'alipay',
          tags: '美食',
        },
      ];
      
      // Mock XLSX
      const mockWorkbook = {};
      const mockWorksheet = { '!cols': [] };
      mockXLSX.utils.book_new.mockReturnValue(mockWorkbook);
      mockXLSX.utils.aoa_to_sheet.mockReturnValue(mockWorksheet);
      mockXLSX.utils.book_append_sheet.mockReturnValue();
      mockXLSX.write.mockReturnValue(new ArrayBuffer(8));
      
      const result = await exportToExcel(transactions);
      
      expect(result.success).toBe(true);
      expect(result.fileName).toMatch(/^账单导出_.*\.xlsx$/);
      expect(result.data).toBeInstanceOf(ArrayBuffer);
      expect(mockXLSX.utils.book_new).toHaveBeenCalled();
      expect(mockXLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    });

    test('should handle empty transactions', async () => {
      const result = await exportToExcel([]);
      
      expect(result).toEqual({ success: false, error: '没有可导出的数据' });
    });

    test('should use custom filename', async () => {
      const transactions = [
        {
          date: '2024-01-01',
          amount: 100,
          type: 'expense',
          description: '午餐',
        },
      ];
      
      // Mock XLSX
      mockXLSX.utils.book_new.mockReturnValue({});
      mockXLSX.utils.aoa_to_sheet.mockReturnValue({ '!cols': [] });
      mockXLSX.utils.book_append_sheet.mockReturnValue();
      mockXLSX.write.mockReturnValue(new ArrayBuffer(8));
      
      const result = await exportToExcel(transactions, 'custom_export.xlsx');
      
      expect(result.fileName).toBe('custom_export.xlsx');
    });

    test('should handle error when exporting to Excel', async () => {
      const transactions = [
        {
          date: '2024-01-01',
          amount: 100,
          type: 'expense',
          description: '午餐',
        },
      ];
      
      // Mock XLSX error
      mockXLSX.utils.book_new.mockReturnValue({});
      mockXLSX.utils.aoa_to_sheet.mockReturnValue({ '!cols': [] });
      mockXLSX.utils.book_append_sheet.mockReturnValue();
      mockXLSX.write.mockImplementation(() => {
        throw new Error('XLSX error');
      });
      
      const result = await exportToExcel(transactions);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('XLSX error');
    });
  });

  describe('detectExcelBillType', () => {
    test('should detect alipay bill type', () => {
      const headers = ['交易号', '商家订单号', '金额'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('alipay');
    });

    test('should detect wechat bill type', () => {
      const headers = ['交易单号', '商户单号', '金额'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('wechat');
    });

    test('should detect bank bill type', () => {
      const headers = ['交易日期', '交易金额', '交易类型'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('bank');
    });

    test('should detect generic bill type', () => {
      const headers = ['日期', '金额', '描述'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('generic');
    });

    test('should return unknown for unknown bill type', () => {
      const headers = ['列1', '列2', '列3'];
      const result = detectExcelBillType(headers);
      expect(result).toBe('unknown');
    });

    test('should return unknown for empty headers', () => {
      const headers = [];
      const result = detectExcelBillType(headers);
      expect(result).toBe('unknown');
    });

    test('should handle case insensitivity', () => {
      const headers = ['交易号', '商家订单号', '金额'];
      const result = detectExcelBillType(headers.map(h => h.toUpperCase()));
      expect(result).toBe('alipay');
    });
  });
});
