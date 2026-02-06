import BaseRepository from './BaseRepository';

/**
 * 预算Repository
 * 处理预算相关的数据库操作
 */
class BudgetRepository extends BaseRepository {
  constructor() {
    super('budgets');
  }

  /**
   * 获取用户的所有预算
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>}
   */
  async getByUserId(userId, options = {}) {
    const { activeOnly = false, dateRange = null } = options;
    
    let whereClause = 'b.user_id = ?';
    const params = [userId];

    if (activeOnly && dateRange) {
      whereClause += ' AND b.start_date <= ? AND b.end_date >= ?';
      params.push(dateRange.end, dateRange.start);
    }

    const db = await this.getDb();
    return await db.getAllAsync(
      `SELECT b.*, c.name as category_name, c.color as category_color,
        COALESCE(SUM(t.amount), 0) as spent_amount
      FROM ${this.tableName} b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON b.category_id = t.category_id 
        AND t.date >= b.start_date 
        AND t.date <= b.end_date
        AND t.type = 'expense'
      WHERE ${whereClause}
      GROUP BY b.id
      ORDER BY b.start_date DESC`,
      params
    );
  }

  /**
   * 获取预算详情（包含支出统计）
   * @param {number} budgetId - 预算ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>}
   */
  async getBudgetWithStats(budgetId, userId) {
    const db = await this.getDb();
    
    const budget = await db.getFirstAsync(
      `SELECT b.*, c.name as category_name, c.color as category_color
      FROM ${this.tableName} b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ? AND b.user_id = ?`,
      [budgetId, userId]
    );

    if (!budget) return null;

    // 计算已支出金额
    const spentResult = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) as spent
      FROM transactions
      WHERE user_id = ? 
      AND category_id = ?
      AND date >= ? 
      AND date <= ?
      AND type = 'expense'`,
      [userId, budget.category_id, budget.start_date, budget.end_date]
    );

    return {
      ...budget,
      spent: spentResult?.spent || 0,
      remaining: budget.amount - (spentResult?.spent || 0),
      percentage: Math.min(((spentResult?.spent || 0) / budget.amount) * 100, 100),
    };
  }

  /**
   * 获取当前生效的预算
   * @param {number} userId - 用户ID
   * @param {string} currentDate - 当前日期
   * @returns {Promise<Array>}
   */
  async getActiveBudgets(userId, currentDate = new Date().toISOString().split('T')[0]) {
    return await this.getByUserId(userId, {
      activeOnly: true,
      dateRange: { start: currentDate, end: currentDate }
    });
  }

  /**
   * 按分类获取预算
   * @param {number} userId - 用户ID
   * @param {number} categoryId - 分类ID
   * @param {string} currentDate - 当前日期
   * @returns {Promise<Object|null>}
   */
  async getByCategory(userId, categoryId, currentDate = new Date().toISOString().split('T')[0]) {
    const db = await this.getDb();
    
    return await db.getFirstAsync(
      `SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND category_id = ?
      AND start_date <= ? AND end_date >= ?
      ORDER BY created_at DESC
      LIMIT 1`,
      [userId, categoryId, currentDate, currentDate]
    );
  }

  /**
   * 获取总预算（不指定分类的预算）
   * @param {number} userId - 用户ID
   * @param {string} currentDate - 当前日期
   * @returns {Promise<Object|null>}
   */
  async getTotalBudget(userId, currentDate = new Date().toISOString().split('T')[0]) {
    const db = await this.getDb();
    
    return await db.getFirstAsync(
      `SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND category_id IS NULL
      AND start_date <= ? AND end_date >= ?
      ORDER BY created_at DESC
      LIMIT 1`,
      [userId, currentDate, currentDate]
    );
  }

  /**
   * 检查预算是否超支
   * @param {number} budgetId - 预算ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async checkBudgetStatus(budgetId, userId) {
    const budget = await this.getBudgetWithStats(budgetId, userId);
    
    if (!budget) return null;

    return {
      isOverBudget: budget.spent > budget.amount,
      isNearLimit: budget.percentage >= 80,
      percentage: budget.percentage,
      remaining: budget.remaining,
      spent: budget.spent,
      total: budget.amount,
    };
  }

  /**
   * 获取预算历史记录
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>}
   */
  async getBudgetHistory(userId, limit = 10) {
    const db = await this.getDb();
    
    return await db.getAllAsync(
      `SELECT b.*, c.name as category_name,
        COALESCE(SUM(t.amount), 0) as spent_amount
      FROM ${this.tableName} b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON b.category_id = t.category_id 
        AND t.date >= b.start_date 
        AND t.date <= b.end_date
        AND t.type = 'expense'
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.end_date DESC
      LIMIT ?`,
      [userId, limit]
    );
  }

  /**
   * 获取预算使用趋势（用于图表）
   * @param {number} userId - 用户ID
   * @param {number} months - 月份数量
   * @returns {Promise<Array>}
   */
  async getBudgetTrend(userId, months = 6) {
    const db = await this.getDb();
    
    return await db.getAllAsync(
      `SELECT 
        strftime('%Y-%m', b.start_date) as month,
        SUM(b.amount) as total_budget,
        COALESCE(SUM(t.amount), 0) as total_spent
      FROM ${this.tableName} b
      LEFT JOIN transactions t ON b.category_id = t.category_id 
        AND t.date >= b.start_date 
        AND t.date <= b.end_date
        AND t.type = 'expense'
      WHERE b.user_id = ?
      AND b.start_date >= date('now', '-${months} months')
      GROUP BY strftime('%Y-%m', b.start_date)
      ORDER BY month ASC`,
      [userId]
    );
  }

  /**
   * 创建周期性预算（自动创建下月/下年预算）
   * @param {number} budgetId - 预算ID
   * @returns {Promise<number|null>} - 返回新预算ID
   */
  async createRecurringBudget(budgetId) {
    const db = await this.getDb();
    
    const budget = await this.findById(budgetId);
    if (!budget || budget.recurring === 'none') return null;

    let newStartDate, newEndDate;
    const startDate = new Date(budget.start_date);
    const endDate = new Date(budget.end_date);

    switch (budget.recurring) {
      case 'daily':
        newStartDate = new Date(startDate.setDate(startDate.getDate() + 1));
        newEndDate = new Date(endDate.setDate(endDate.getDate() + 1));
        break;
      case 'weekly':
        newStartDate = new Date(startDate.setDate(startDate.getDate() + 7));
        newEndDate = new Date(endDate.setDate(endDate.getDate() + 7));
        break;
      case 'monthly':
        newStartDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
        newEndDate = new Date(endDate.setMonth(endDate.getMonth() + 1));
        break;
      case 'yearly':
        newStartDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
        newEndDate = new Date(endDate.setFullYear(endDate.getFullYear() + 1));
        break;
      default:
        return null;
    }

    const newBudgetId = await this.create({
      user_id: budget.user_id,
      amount: budget.amount,
      category_id: budget.category_id,
      start_date: newStartDate.toISOString().split('T')[0],
      end_date: newEndDate.toISOString().split('T')[0],
      recurring: budget.recurring,
      description: budget.description,
    });

    return newBudgetId;
  }
}

export default new BudgetRepository();
