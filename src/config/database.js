import * as SQLite from 'expo-sqlite';

// 数据库版本号，用于迁移管理
const DATABASE_VERSION = 1;
const DATABASE_NAME = 'billApp.db';

// 获取数据库实例
let dbInstance = null;

export const getDatabase = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await initializeDatabase(dbInstance);
  }
  return dbInstance;
};

// 初始化数据库
const initializeDatabase = async (db) => {
  try {
    // 创建版本控制表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        version INTEGER NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 获取当前版本
    const versionResult = await db.getFirstAsync('SELECT version FROM schema_version WHERE id = 1');
    const currentVersion = versionResult?.version || 0;

    // 执行迁移
    if (currentVersion < DATABASE_VERSION) {
      await runMigrations(db, currentVersion, DATABASE_VERSION);
    }

    console.log('数据库初始化成功，当前版本:', DATABASE_VERSION);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 执行数据库迁移
const runMigrations = async (db, fromVersion, toVersion) => {
  console.log(`执行数据库迁移: ${fromVersion} -> ${toVersion}`);

  // 开始事务
  await db.execAsync('BEGIN TRANSACTION');

  try {
    // 版本 0 -> 1: 初始表结构
    if (fromVersion < 1) {
      await migrateToV1(db);
    }

    // 更新版本号
    await db.runAsync(
      `INSERT OR REPLACE INTO schema_version (id, version, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)`,
      [toVersion]
    );

    // 提交事务
    await db.execAsync('COMMIT');
    console.log('数据库迁移完成');
  } catch (error) {
    // 回滚事务
    await db.execAsync('ROLLBACK');
    console.error('数据库迁移失败:', error);
    throw error;
  }
};

// 迁移到版本1: 创建初始表结构
const migrateToV1 = async (db) => {
  console.log('创建初始表结构 (v1)...');

  // 1. 用户表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(255),
      default_currency VARCHAR(10) DEFAULT 'CNY',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. 分类表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(50) NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
      icon VARCHAR(50),
      color VARCHAR(20),
      order_index INTEGER DEFAULT 0,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. 账单表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(12,2) NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      payment_method VARCHAR(50),
      platform VARCHAR(20) CHECK (platform IN ('alipay', 'wechat', 'other')),
      date DATE NOT NULL,
      time TIME,
      description TEXT,
      location VARCHAR(255),
      receipt_image VARCHAR(255),
      is_imported BOOLEAN DEFAULT FALSE,
      import_source VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. 预算表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(12,2) NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      recurring VARCHAR(20) CHECK (recurring IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. 货币表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS currencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(50) NOT NULL,
      symbol VARCHAR(10) NOT NULL,
      exchange_rate DECIMAL(10,6) DEFAULT 1.0,
      is_active BOOLEAN DEFAULT TRUE
    );
  `);

  // 6. 设置表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      key VARCHAR(50) NOT NULL,
      value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, key)
    );
  `);

  // 7. AI规则表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ai_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      pattern TEXT NOT NULL,
      action TEXT NOT NULL,
      confidence DECIMAL(3,2) DEFAULT 0.8,
      is_active BOOLEAN DEFAULT TRUE,
      usage_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建索引优化查询性能
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
  `);

  // 插入默认货币数据
  await insertDefaultCurrencies(db);

  // 插入默认分类数据
  await insertDefaultCategories(db);

  console.log('初始表结构创建完成');
};

// 插入默认货币
const insertDefaultCurrencies = async (db) => {
  const currencies = [
    { code: 'CNY', name: '人民币', symbol: '¥', exchange_rate: 1.0 },
    { code: 'USD', name: '美元', symbol: '$', exchange_rate: 7.2 },
    { code: 'EUR', name: '欧元', symbol: '€', exchange_rate: 7.8 },
    { code: 'JPY', name: '日元', symbol: '¥', exchange_rate: 0.048 },
    { code: 'KRW', name: '韩元', symbol: '₩', exchange_rate: 0.0054 },
  ];

  for (const currency of currencies) {
    await db.runAsync(
      `INSERT OR IGNORE INTO currencies (code, name, symbol, exchange_rate) VALUES (?, ?, ?, ?)`,
      [currency.code, currency.name, currency.symbol, currency.exchange_rate]
    );
  }
};

// 插入默认分类
const insertDefaultCategories = async (db) => {
  // 默认支出分类
  const expenseCategories = [
    { name: '餐饮', icon: 'restaurant', color: '#FF6B6B', order_index: 1 },
    { name: '交通', icon: 'car', color: '#4ECDC4', order_index: 2 },
    { name: '购物', icon: 'cart', color: '#45B7D1', order_index: 3 },
    { name: '娱乐', icon: 'game-controller', color: '#96CEB4', order_index: 4 },
    { name: '医疗', icon: 'medical', color: '#FFEAA7', order_index: 5 },
    { name: '教育', icon: 'school', color: '#DDA0DD', order_index: 6 },
    { name: '房租', icon: 'home', color: '#98D8C8', order_index: 7 },
    { name: '水电费', icon: 'flash', color: '#F7DC6F', order_index: 8 },
    { name: '通讯费', icon: 'call', color: '#BB8FCE', order_index: 9 },
    { name: '其他', icon: 'ellipsis-horizontal', color: '#BDC3C7', order_index: 10 },
  ];

  // 默认收入分类
  const incomeCategories = [
    { name: '工资', icon: 'cash', color: '#2ECC71', order_index: 1 },
    { name: '奖金', icon: 'trophy', color: '#F39C12', order_index: 2 },
    { name: '投资收益', icon: 'trending-up', color: '#E74C3C', order_index: 3 },
    { name: '兼职', icon: 'briefcase', color: '#9B59B6', order_index: 4 },
    { name: '礼金', icon: 'gift', color: '#1ABC9C', order_index: 5 },
    { name: '其他', icon: 'ellipsis-horizontal', color: '#BDC3C7', order_index: 6 },
  ];

  // 插入支出分类
  for (const cat of expenseCategories) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (name, type, icon, color, order_index, is_default) VALUES (?, 'expense', ?, ?, ?, TRUE)`,
      [cat.name, cat.icon, cat.color, cat.order_index]
    );
  }

  // 插入收入分类
  for (const cat of incomeCategories) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (name, type, icon, color, order_index, is_default) VALUES (?, 'income', ?, ?, ?, TRUE)`,
      [cat.name, cat.icon, cat.color, cat.order_index]
    );
  }
};

// 重置数据库（开发调试用）
export const resetDatabase = async () => {
  try {
    if (dbInstance) {
      await dbInstance.closeAsync();
      dbInstance = null;
    }
    await SQLite.deleteDatabaseAsync(DATABASE_NAME);
    console.log('数据库已重置');
  } catch (error) {
    console.error('重置数据库失败:', error);
    throw error;
  }
};

export default { getDatabase, resetDatabase };
