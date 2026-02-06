import BaseRepository from './BaseRepository';

/**
 * 分类Repository
 * 处理分类相关的数据库操作
 */
class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories');
  }

  /**
   * 获取所有分类（包括系统默认和用户自定义）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>}
   */
  async getAll(options = {}) {
    const { type, userId, includeDefault = true } = options;
    
    let whereClause = '';
    const params = [];
    const conditions = [];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (includeDefault && userId) {
      conditions.push('(is_default = TRUE OR user_id = ?)');
      params.push(userId);
    } else if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const db = await this.getDb();
    return await db.getAllAsync(
      `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY type, order_index, name`,
      params
    );
  }

  /**
   * 按类型获取分类
   * @param {string} type - 类型（income/expense）
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>}
   */
  async getByType(type, userId) {
    return await this.getAll({ type, userId });
  }

  /**
   * 获取默认分类
   * @param {string} type - 类型（可选）
   * @returns {Promise<Array>}
   */
  async getDefaultCategories(type = null) {
    let whereClause = 'is_default = TRUE';
    const params = [];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    const db = await this.getDb();
    return await db.getAllAsync(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY type, order_index`,
      params
    );
  }

  /**
   * 获取用户的自定义分类
   * @param {number} userId - 用户ID
   * @param {string} type - 类型（可选）
   * @returns {Promise<Array>}
   */
  async getUserCategories(userId, type = null) {
    let whereClause = 'user_id = ? AND is_default = FALSE';
    const params = [userId];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    const db = await this.getDb();
    return await db.getAllAsync(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY order_index, name`,
      params
    );
  }

  /**
   * 根据名称查找分类（用于自动分类）
   * @param {string} name - 分类名称
   * @param {string} type - 类型
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>}
   */
  async findByName(name, type, userId) {
    const db = await this.getDb();
    return await db.getFirstAsync(
      `SELECT * FROM ${this.tableName} 
       WHERE name = ? AND type = ? AND (is_default = TRUE OR user_id = ?)
       LIMIT 1`,
      [name, type, userId]
    );
  }

  /**
   * 获取下一个排序索引
   * @param {string} type - 类型
   * @returns {Promise<number>}
   */
  async getNextOrderIndex(type) {
    const db = await this.getDb();
    const result = await db.getFirstAsync(
      `SELECT MAX(order_index) as max_index FROM ${this.tableName} WHERE type = ?`,
      [type]
    );
    return (result?.max_index || 0) + 1;
  }

  /**
   * 为用户初始化默认分类
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  async initializeDefaultCategoriesForUser(userId) {
    const db = await this.getDb();
    
    // 获取所有默认分类
    const defaultCategories = await this.getDefaultCategories();
    
    // 为每个默认分类创建用户副本
    for (const category of defaultCategories) {
      await db.runAsync(
        `INSERT INTO ${this.tableName} (user_id, name, type, icon, color, order_index, is_default)
         VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
        [userId, category.name, category.type, category.icon, category.color, category.order_index]
      );
    }
  }

  /**
   * 更新分类排序
   * @param {Array} categoryIds - 分类ID数组（按新顺序排列）
   * @returns {Promise<void>}
   */
  async updateOrder(categoryIds) {
    const db = await this.getDb();
    
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      for (let i = 0; i < categoryIds.length; i++) {
        await db.runAsync(
          `UPDATE ${this.tableName} SET order_index = ? WHERE id = ?`,
          [i + 1, categoryIds[i]]
        );
      }
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * 检查分类是否在使用中
   * @param {number} categoryId - 分类ID
   * @returns {Promise<boolean>}
   */
  async isInUse(categoryId) {
    const db = await this.getDb();
    const result = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM transactions WHERE category_id = ?`,
      [categoryId]
    );
    return result?.count > 0;
  }

  /**
   * 获取分类统计信息
   * @param {number} categoryId - 分类ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async getStatistics(categoryId, userId) {
    const db = await this.getDb();
    
    const result = await db.getFirstAsync(
      `SELECT 
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as total_amount,
        MIN(date) as first_transaction,
        MAX(date) as last_transaction
      FROM transactions 
      WHERE category_id = ? AND user_id = ?`,
      [categoryId, userId]
    );

    return {
      transactionCount: result?.transaction_count || 0,
      totalAmount: result?.total_amount || 0,
      firstTransaction: result?.first_transaction,
      lastTransaction: result?.last_transaction,
    };
  }
}

export default new CategoryRepository();
