import { getDatabase } from '../config/database';

/**
 * 基础Repository类
 * 提供通用的CRUD操作，其他Repository继承此类
 */
export default class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * 获取数据库实例
   */
  async getDb() {
    return await getDatabase();
  }

  /**
   * 查找所有记录
   * @param {string} whereClause - WHERE条件
   * @param {array} params - 参数数组
   * @param {string} orderBy - 排序条件
   * @returns {Promise<Array>}
   */
  async findAll(whereClause = '', params = [], orderBy = 'id DESC') {
    const db = await this.getDb();
    const query = `SELECT * FROM ${this.tableName} ${whereClause ? 'WHERE ' + whereClause : ''} ORDER BY ${orderBy}`;
    return await db.getAllAsync(query, params);
  }

  /**
   * 根据ID查找单条记录
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const db = await this.getDb();
    return await db.getFirstAsync(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  /**
   * 插入新记录
   * @param {Object} data - 数据对象
   * @returns {Promise<number>} - 返回新记录的ID
   */
  async create(data) {
    const db = await this.getDb();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(',');

    const result = await db.runAsync(
      `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`,
      values
    );

    return result.lastInsertRowId;
  }

  /**
   * 更新记录
   * @param {number} id - 记录ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<boolean>}
   */
  async update(id, data) {
    const db = await this.getDb();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(',');

    const result = await db.runAsync(
      `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    return result.changes > 0;
  }

  /**
   * 删除记录
   * @param {number} id - 记录ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const db = await this.getDb();
    const result = await db.runAsync(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result.changes > 0;
  }

  /**
   * 根据条件删除记录
   * @param {string} whereClause - WHERE条件
   * @param {array} params - 参数数组
   * @returns {Promise<number>} - 返回删除的记录数
   */
  async deleteWhere(whereClause, params = []) {
    const db = await this.getDb();
    const result = await db.runAsync(
      `DELETE FROM ${this.tableName} WHERE ${whereClause}`,
      params
    );

    return result.changes;
  }

  /**
   * 执行原始SQL查询
   * @param {string} sql - SQL语句
   * @param {array} params - 参数数组
   * @returns {Promise<Array>}
   */
  async query(sql, params = []) {
    const db = await this.getDb();
    return await db.getAllAsync(sql, params);
  }

  /**
   * 执行原始SQL语句（用于INSERT/UPDATE/DELETE）
   * @param {string} sql - SQL语句
   * @param {array} params - 参数数组
   * @returns {Promise<Object>}
   */
  async execute(sql, params = []) {
    const db = await this.getDb();
    return await db.runAsync(sql, params);
  }

  /**
   * 统计记录数
   * @param {string} whereClause - WHERE条件
   * @param {array} params - 参数数组
   * @returns {Promise<number>}
   */
  async count(whereClause = '', params = []) {
    const db = await this.getDb();
    const result = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause ? 'WHERE ' + whereClause : ''}`,
      params
    );

    return result?.count || 0;
  }
}
