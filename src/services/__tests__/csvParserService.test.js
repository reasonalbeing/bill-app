import {
  parseCSV,
  detectBillType,
  parseAlipayBill,
  parseWechatBill,
  autoCategorize,
  convertToAppFormat,
} from '../csvParserService';

describe('csvParserService', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV content', async () => {
      const csvContent = 'name,age,city\nJohn,30,New York\nJane,25,London';
      const result = await parseCSV(csvContent);

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ name: 'John', age: '30', city: 'New York' });
    });

    it('should handle Windows line endings', async () => {
      const csvContent = 'name,age\r\nJohn,30\r\nJane,25';
      const result = await parseCSV(csvContent);

      expect(result.data).toHaveLength(2);
    });

    it('should handle quoted fields with commas', async () => {
      const csvContent = 'name,description\nJohn,"Hello, World"\nJane,"Test, CSV"';
      const result = await parseCSV(csvContent);

      expect(result.data[0].description).toBe('Hello, World');
    });

    it('should handle empty quoted fields', async () => {
      const csvContent = 'name,description\nJohn,""\nJane,Test';
      const result = await parseCSV(csvContent);

      expect(result.data[0].description).toBe('');
    });

    it('should reject empty CSV', async () => {
      await expect(parseCSV('')).rejects.toThrow('CSV文件为空');
    });

    it('should handle whitespace trimming', async () => {
      const csvContent = 'name,age\n  John  ,  30  ';
      const result = await parseCSV(csvContent);

      expect(result.data[0].name).toBe('John');
      expect(result.data[0].age).toBe('30');
    });
  });

  describe('detectBillType', () => {
    it('should detect Alipay bill', () => {
      const headers = ['交易号', '商家订单号', '创建时间', '金额'];
      const result = detectBillType(headers);

      expect(result).toBe('alipay');
    });

    it('should detect WeChat bill', () => {
      const headers = ['交易单号', '商户单号', '交易时间', '金额(元)'];
      const result = detectBillType(headers);

      expect(result).toBe('wechat');
    });

    it('should return unknown for unrecognized headers', () => {
      const headers = ['id', 'name', 'amount'];
      const result = detectBillType(headers);

      expect(result).toBe('unknown');
    });

    it('should be case insensitive', () => {
      const headers = ['交易号', '商家订单号'];
      const result = detectBillType(headers);

      expect(result).toBe('alipay');
    });
  });

  describe('parseAlipayBill', () => {
    it('should parse Alipay transactions', () => {
      const csvData = [
        {
          '交易号': '2024010112345678',
          '商家订单号': 'ORDER123',
          '创建时间': '2024-01-01 12:30:45',
          '金额': '¥100.50',
          '收/支': '支出',
          '交易对方': '麦当劳',
          '商品名称': '午餐',
          '收/付款方式': '余额',
          '交易状态': '交易成功',
        },
      ];

      const result = parseAlipayBill(csvData);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        amount: 100.5,
        type: 'expense',
        date: '2024-01-01',
        time: '12:30:45',
        description: '午餐',
        counterparty: '麦当劳',
        platform: 'alipay',
        paymentMethod: '余额',
      });
    });

    it('should parse income transactions', () => {
      const csvData = [
        {
          '交易号': '2024010112345679',
          '创建时间': '2024-01-01 10:00:00',
          '金额(元)': '¥5000.00',
          '收/支': '收入',
          '交易对方': '公司',
          '商品名称': '工资',
          '交易状态': '交易成功',
        },
      ];

      const result = parseAlipayBill(csvData);

      expect(result[0].type).toBe('income');
      expect(result[0].amount).toBe(5000);
    });

    it('should skip closed transactions', () => {
      const csvData = [
        {
          '交易号': '2024010112345680',
          '创建时间': '2024-01-01 10:00:00',
          '金额': '¥100.00',
          '收/支': '支出',
          '交易状态': '交易关闭',
        },
      ];

      const result = parseAlipayBill(csvData);

      expect(result).toHaveLength(0);
    });

    it('should skip refunded transactions', () => {
      const csvData = [
        {
          '交易号': '2024010112345681',
          '创建时间': '2024-01-01 10:00:00',
          '金额': '¥100.00',
          '收/支': '支出',
          '交易状态': '退款成功',
        },
      ];

      const result = parseAlipayBill(csvData);

      expect(result).toHaveLength(0);
    });

    it('should skip non-income/expense transactions', () => {
      const csvData = [
        {
          '交易号': '2024010112345682',
          '创建时间': '2024-01-01 10:00:00',
          '金额': '¥1000.00',
          '收/支': '转账',
          '交易状态': '交易成功',
        },
      ];

      const result = parseAlipayBill(csvData);

      expect(result).toHaveLength(0);
    });

    it('should skip header rows', () => {
      const csvData = [
        {
          '交易号': '交易号',
          '创建时间': '创建时间',
        },
        {
          '交易号': '2024010112345683',
          '创建时间': '2024-01-01 10:00:00',
          '金额': '¥50.00',
          '收/支': '支出',
          '交易状态': '交易成功',
        },
      ];

      const result = parseAlipayBill(csvData);

      expect(result).toHaveLength(1);
    });

    it('should handle missing amount', () => {
      const csvData = [
        {
          '交易号': '2024010112345684',
          '创建时间': '2024-01-01 10:00:00',
          '金额': '',
          '收/支': '支出',
          '交易状态': '交易成功',
        },
      ];

      const result = parseAlipayBill(csvData);

      expect(result).toHaveLength(0);
    });

    it('should use counterparty as description when product name is empty', () => {
      const csvData = [
        {
          '交易号': '2024010112345685',
          '创建时间': '2024-01-01 10:00:00',
          '金额': '¥30.00',
          '收/支': '支出',
          '交易对方': '便利店',
          '商品名称': '',
          '交易状态': '交易成功',
        },
      ];

      const result = parseAlipayBill(csvData);

      expect(result[0].description).toBe('便利店');
    });
  });

  describe('parseWechatBill', () => {
    it('should parse WeChat transactions', () => {
      const csvData = [
        {
          '交易单号': '4200000123456789',
          '商户单号': 'MERCHANT123',
          '交易时间': '2024-01-01 14:20:30',
          '金额(元)': '¥88.88',
          '收/支': '支出',
          '交易对方': '星巴克',
          '商品': '咖啡',
          '支付方式': '零钱',
          '当前状态': '支付成功',
        },
      ];

      const result = parseWechatBill(csvData);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        amount: 88.88,
        type: 'expense',
        date: '2024-01-01',
        time: '14:20:30',
        description: '咖啡',
        counterparty: '星巴克',
        platform: 'wechat',
        paymentMethod: '零钱',
      });
    });

    it('should skip refunded transactions', () => {
      const csvData = [
        {
          '交易单号': '4200000123456790',
          '交易时间': '2024-01-01 10:00:00',
          '金额(元)': '¥100.00',
          '收/支': '支出',
          '当前状态': '已退款',
        },
      ];

      const result = parseWechatBill(csvData);

      expect(result).toHaveLength(0);
    });

    it('should skip cancelled transactions', () => {
      const csvData = [
        {
          '交易单号': '4200000123456791',
          '交易时间': '2024-01-01 10:00:00',
          '金额(元)': '¥100.00',
          '收/支': '支出',
          '当前状态': '已撤销',
        },
      ];

      const result = parseWechatBill(csvData);

      expect(result).toHaveLength(0);
    });

    it('should handle default date when format is invalid', () => {
      const csvData = [
        {
          '交易单号': '4200000123456792',
          '交易时间': 'invalid date',
          '金额(元)': '¥50.00',
          '收/支': '支出',
          '当前状态': '支付成功',
        },
      ];

      const result = parseWechatBill(csvData);

      expect(result[0].date).toBe(new Date().toISOString().split('T')[0]);
    });
  });

  describe('autoCategorize', () => {
    const categories = [
      { id: 1, name: '餐饮' },
      { id: 2, name: '交通' },
      { id: 3, name: '购物' },
      { id: 4, name: '其他' },
    ];

    it('should categorize food transactions', () => {
      const transaction = {
        description: '麦当劳午餐',
        counterparty: '麦当劳餐厅',
      };

      const result = autoCategorize(transaction, categories);

      expect(result).toBe(1); // 餐饮
    });

    it('should categorize transport transactions', () => {
      const transaction = {
        description: '滴滴打车',
        counterparty: '滴滴出行',
      };

      const result = autoCategorize(transaction, categories);

      expect(result).toBe(2); // 交通
    });

    it('should categorize shopping transactions', () => {
      const transaction = {
        description: '京东购物',
        counterparty: '京东商城',
      };

      const result = autoCategorize(transaction, categories);

      expect(result).toBe(3); // 购物
    });

    it('should return default category when no match', () => {
      const transaction = {
        description: '未知交易',
        counterparty: '某公司',
      };

      const result = autoCategorize(transaction, categories);

      expect(result).toBe(4); // 其他
    });

    it('should return null when no default category', () => {
      const transaction = {
        description: '未知交易',
      };

      const result = autoCategorize(transaction, [{ id: 1, name: '餐饮' }]);

      expect(result).toBeNull();
    });

    it('should be case insensitive', () => {
      const transaction = {
        description: 'KFC',
        counterparty: '肯德基',
      };

      const result = autoCategorize(transaction, categories);

      expect(result).toBe(1);
    });
  });

  describe('convertToAppFormat', () => {
    const categories = [
      { id: 1, name: '餐饮' },
      { id: 2, name: '其他' },
    ];

    it('should convert transactions to app format', () => {
      const transactions = [
        {
          amount: 100,
          type: 'expense',
          date: '2024-01-01',
          time: '12:00:00',
          description: '麦当劳',
          counterparty: '麦当劳',
          platform: 'alipay',
          paymentMethod: '余额',
        },
      ];

      const result = convertToAppFormat(transactions, categories, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        amount: 100,
        type: 'expense',
        date: '2024-01-01',
        time: '12:00:00',
        description: '麦当劳',
        platform: 'alipay',
        payment_method: '余额',
        is_imported: true,
        import_source: 'alipay',
        user_id: 1,
      });
    });

    it('should auto-categorize transactions', () => {
      const transactions = [
        {
          amount: 50,
          type: 'expense',
          date: '2024-01-01',
          description: '肯德基',
          counterparty: '肯德基',
          platform: 'wechat',
          paymentMethod: '零钱',
        },
      ];

      const result = convertToAppFormat(transactions, categories, 1);

      expect(result[0].category_id).toBe(1); // 餐饮
    });

    it('should handle empty transactions array', () => {
      const result = convertToAppFormat([], categories, 1);

      expect(result).toEqual([]);
    });
  });
});
