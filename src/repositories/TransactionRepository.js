import BaseRepository from './BaseRepository';

/**
 * 账单Repository
 * 处理账单相关的数据库操作
 */
class TransactionRepository extends BaseRepository {
  constructor() {
    super('transactions');
  }

  /**
   * 获取用户的所有账单
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>}
   */
  async getByUserId(userId, options = {}) {
    const { type, startDate, endDate, categoryId, limit = 100, offset = 0 } = options;
    
    let whereClause = 'user_id = ?';
    const params = [userId];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }

    if (categoryId) {
      whereClause += ' AND category_id = ?';
      params.push(categoryId);
    }

    const db = await this.getDb();
    const query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM ${this.tableName} t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    return await db.getAllAsync(query, [...params, limit, offset]);
  }

  /**
   * 获取账单统计信息
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getStatistics(userId, options = {}) {
    const { startDate, endDate, groupBy = 'category' } = options;
    
    let whereClause = 'user_id = ? AND type = ?';
    const params = [userId];

    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }

    const db = await this.getDb();

    // 总收入
    const incomeResult = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) as total FROM ${this.tableName} WHERE ${whereClause}`,
      [...params, 'income']
    );

    // 总支出
    const expenseResult = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) as total FROM ${this.tableName} WHERE ${whereClause}`,
      [...params, 'expense']
    );

    // 按分类统计
    let categoryStats = [];
    if (groupBy === 'category') {
      categoryStats = await db.getAllAsync(
        `SELECT 
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color,
          t.type,
          COALESCE(SUM(t.amount), 0) as total_amount,
          COUNT(*) as transaction_count
        FROM ${this.tableName} t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.${whereClause}
        GROUP BY t.category_id, t.type
        ORDER BY total_amount DESC`,
        [...params, 'expense']
      );
    }

    // 按日期统计（用于趋势图）
    const dailyStats = await db.getAllAsync(
      `SELECT 
        date,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM ${this.tableName}
      WHERE user_id = ? ${startDate ? 'AND date >= ?' : ''} ${endDate ? 'AND date <= ?' : ''}
      GROUP BY date
      ORDER BY date ASC`,
      [userId, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])]
    );

    return {
      totalIncome: incomeResult?.total || 0,
      totalExpense: expenseResult?.total || 0,
      balance: (incomeResult?.total || 0) - (expenseResult?.total || 0),
      categoryStats,
      dailyStats,
    };
  }

  /**
   * 获取导入的账单（用于重复检测）
   * @param {number} userId - 用户ID
   * @param {Object} transaction - 账单数据
   * @returns {Promise<Array>}
   */
  async findDuplicate(userId, transaction) {
    const { amount, date, description, importSource } = transaction;
    
    const db = await this.getDb();
    return await db.getAllAsync(
      `SELECT * FROM ${this.tableName} 
       WHERE user_id = ? 
       AND amount = ? 
       AND date = ? 
       AND (description = ? OR import_source = ?)
       LIMIT 5`,
      [userId, amount, date, description, importSource]
    );
  }

  /**
   * 批量插入账单（用于导入功能）
   * @param {Array} transactions - 账单数组
   * @returns {Promise<Object>}
   */
  async batchCreate(transactions) {
    const db = await this.getDb();
    const results = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    };

    await db.execAsync('BEGIN TRANSACTION');

    try {
      for (const transaction of transactions) {
        try {
          // 检查重复
          const duplicates = await this.findDuplicate(transaction.user_id, transaction);
          if (duplicates.length > 0) {
            results.duplicates++;
            continue;
          }

          await this.create(transaction);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ transaction, error: error.message });
        }
      }

      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }

    return results;
  }

  /**
   * 获取指定日期范围的账单
   * @param {number} userId - 用户ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Array>}
   */
  async getByDateRange(userId, startDate, endDate) {
    return await this.getByUserId(userId, { startDate, endDate });
  }

  /**
   * 获取最近的交易记录
   * @param {number} userId - 用户ID
   * @param {number} limit - 数量限制
   * @returns {Promise<Array>}
   */
  async getRecent(userId, limit = 10) {
    return await this.getByUserId(userId, { limit });
  }

  /**
   * 按平台统计
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>}
   */
  async getPlatformStats(userId, options = {}) {
    const { startDate, endDate } = options;
    
    let whereClause = 'user_id = ? AND type = ?';
    const params = [userId, 'expense'];

    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }

    const db = await this.getDb();
    return await db.getAllAsync(
      `SELECT 
        platform,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count
      FROM ${this.tableName}
      WHERE ${whereClause}
      GROUP BY platform
      ORDER BY total_amount DESC`,
      params
    );
  }
}

export default new TransactionRepository();
