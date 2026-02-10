/**
 * 数据备份与恢复服务
 * 用于管理应用数据的备份、恢复和导出
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';
import { getDatabase } from '../config/database';

// 备份文件存储目录
const BACKUP_DIRECTORY = FileSystem.documentDirectory + 'backups/';

/**
 * 初始化备份目录
 */
export const initBackupDirectory = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIRECTORY, { intermediates: true });
    }
    return { success: true };
  } catch (error) {
    console.error('初始化备份目录失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 获取所有数据用于备份
 */
const getAllDataForBackup = async () => {
  try {
    const db = await getDatabase();
    
    // 获取所有表的数据
    const tables = ['users', 'transactions', 'categories', 'budgets', 'currencies', 'settings', 'ai_rules'];
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {}
    };

    for (const table of tables) {
      try {
        const result = await db.getAllAsync(`SELECT * FROM ${table}`);
        backupData.data[table] = result;
      } catch (e) {
        console.warn(`获取表 ${table} 数据失败:`, e);
        backupData.data[table] = [];
      }
    }

    return backupData;
  } catch (error) {
    console.error('获取备份数据失败:', error);
    throw error;
  }
};

/**
 * 创建本地备份
 * @param {string} backupName - 备份文件名（可选）
 */
export const createBackup = async (backupName = null) => {
  try {
    await initBackupDirectory();
    
    // 获取所有数据
    const backupData = await getAllDataForBackup();
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = backupName ? `${backupName}.json` : `backup_${timestamp}.json`;
    const filePath = BACKUP_DIRECTORY + fileName;
    
    // 写入文件
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(backupData, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );
    
    return {
      success: true,
      filePath,
      fileName,
      timestamp: backupData.timestamp,
    };
  } catch (error) {
    console.error('创建备份失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 获取所有备份文件列表
 */
export const getBackupList = async () => {
  try {
    await initBackupDirectory();
    
    const files = await FileSystem.readDirectoryAsync(BACKUP_DIRECTORY);
    const backupFiles = [];
    
    for (const fileName of files) {
      if (fileName.endsWith('.json')) {
        const filePath = BACKUP_DIRECTORY + fileName;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        try {
          const content = await FileSystem.readAsStringAsync(filePath);
          const data = JSON.parse(content);
          
          backupFiles.push({
            fileName,
            filePath,
            size: fileInfo.size,
            timestamp: data.timestamp || fileInfo.modificationTime,
            version: data.version || 'unknown',
          });
        } catch (e) {
          // 如果文件损坏，仍然显示但标记为无效
          backupFiles.push({
            fileName,
            filePath,
            size: fileInfo.size,
            timestamp: fileInfo.modificationTime,
            version: 'invalid',
            isInvalid: true,
          });
        }
      }
    }
    
    // 按时间倒序排列
    backupFiles.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return { success: true, backups: backupFiles };
  } catch (error) {
    console.error('获取备份列表失败:', error);
    return { success: false, error: error.message, backups: [] };
  }
};

/**
 * 分享备份文件
 * @param {string} filePath - 备份文件路径
 */
export const shareBackup = async (filePath) => {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('分享功能不可用');
    }
    
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: '分享备份文件',
    });
    
    return { success: true };
  } catch (error) {
    console.error('分享备份失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 删除备份文件
 * @param {string} filePath - 备份文件路径
 */
export const deleteBackup = async (filePath) => {
  try {
    await FileSystem.deleteAsync(filePath);
    return { success: true };
  } catch (error) {
    console.error('删除备份失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 从文件恢复数据
 * @param {string} filePath - 备份文件路径
 */
export const restoreFromBackup = async (filePath) => {
  try {
    // 读取备份文件
    const content = await FileSystem.readAsStringAsync(filePath);
    const backupData = JSON.parse(content);
    
    if (!backupData.data || !backupData.version) {
      throw new Error('无效的备份文件格式');
    }
    
    const db = await getDatabase();
    
    // 开始事务
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // 清空现有数据（保留用户表）
      await db.execAsync('DELETE FROM transactions');
      await db.execAsync('DELETE FROM categories');
      await db.execAsync('DELETE FROM budgets');
      await db.execAsync('DELETE FROM ai_rules');
      
      // 恢复分类数据
      if (backupData.data.categories && backupData.data.categories.length > 0) {
        for (const category of backupData.data.categories) {
          await db.runAsync(
            `INSERT INTO categories (id, user_id, name, type, icon, color, is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              category.id,
              category.user_id,
              category.name,
              category.type,
              category.icon,
              category.color,
              category.is_default,
              category.created_at,
              category.updated_at,
            ]
          );
        }
      }
      
      // 恢复账单数据
      if (backupData.data.transactions && backupData.data.transactions.length > 0) {
        for (const transaction of backupData.data.transactions) {
          await db.runAsync(
            `INSERT INTO transactions (id, user_id, amount, type, category_id, description, date, 
             payment_method, platform, is_imported, import_source, is_from_ai, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              transaction.id,
              transaction.user_id,
              transaction.amount,
              transaction.type,
              transaction.category_id,
              transaction.description,
              transaction.date,
              transaction.payment_method,
              transaction.platform,
              transaction.is_imported,
              transaction.import_source,
              transaction.is_from_ai,
              transaction.created_at,
              transaction.updated_at,
            ]
          );
        }
      }
      
      // 恢复预算数据
      if (backupData.data.budgets && backupData.data.budgets.length > 0) {
        for (const budget of backupData.data.budgets) {
          await db.runAsync(
            `INSERT INTO budgets (id, user_id, category_id, amount, start_date, end_date, 
             recurring, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              budget.id,
              budget.user_id,
              budget.category_id,
              budget.amount,
              budget.start_date,
              budget.end_date,
              budget.recurring,
              budget.description,
              budget.created_at,
              budget.updated_at,
            ]
          );
        }
      }
      
      // 提交事务
      await db.execAsync('COMMIT');
      
      return {
        success: true,
        message: '数据恢复成功',
        restoredAt: new Date().toISOString(),
      };
    } catch (error) {
      // 回滚事务
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('恢复备份失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 从外部文件导入备份
 */
export const importBackupFromFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const file = result.assets[0];
    
    // 验证文件
    const content = await FileSystem.readAsStringAsync(file.uri);
    const backupData = JSON.parse(content);
    
    if (!backupData.data || !backupData.version) {
      throw new Error('无效的备份文件');
    }
    
    // 复制到备份目录
    await initBackupDirectory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newFileName = `imported_${timestamp}.json`;
    const newFilePath = BACKUP_DIRECTORY + newFileName;
    
    await FileSystem.copyAsync({
      from: file.uri,
      to: newFilePath,
    });
    
    return {
      success: true,
      filePath: newFilePath,
      fileName: newFileName,
      backupData,
    };
  } catch (error) {
    console.error('导入备份失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 导出数据为CSV格式
 * @param {Array} transactions - 交易记录数组
 * @param {string} fileName - 文件名
 */
export const exportToCSV = async (transactions, fileName = null) => {
  try {
    if (!transactions || transactions.length === 0) {
      throw new Error('没有可导出的数据');
    }
    
    // 生成CSV内容
    const headers = ['日期', '类型', '金额', '分类', '描述', '支付方式', '平台'];
    const rows = transactions.map(t => [
      t.date,
      t.type === 'expense' ? '支出' : '收入',
      t.amount,
      t.category_name || t.category || '未分类',
      t.description || '',
      t.payment_method || '',
      t.platform || '',
    ]);
    
    // 转义CSV特殊字符
    const escapeCSV = (value) => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');
    
    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    const finalContent = BOM + csvContent;
    
    // 生成文件名
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFileName = fileName || `账单导出_${timestamp}.csv`;
    const filePath = FileSystem.cacheDirectory + finalFileName;
    
    // 写入文件
    await FileSystem.writeAsStringAsync(
      filePath,
      finalContent,
      { encoding: FileSystem.EncodingType.UTF8 }
    );
    
    // 分享文件
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: '导出账单数据',
      });
    }
    
    return { success: true, filePath, fileName: finalFileName };
  } catch (error) {
    console.error('导出CSV失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 自动备份
 * 在应用启动或特定操作时自动创建备份
 */
export const autoBackup = async () => {
  try {
    // 检查是否需要自动备份（例如：距离上次备份超过7天）
    const backupList = await getBackupList();
    
    if (backupList.success && backupList.backups.length > 0) {
      const latestBackup = backupList.backups[0];
      const lastBackupTime = new Date(latestBackup.timestamp);
      const now = new Date();
      const daysSinceLastBackup = (now - lastBackupTime) / (1000 * 60 * 60 * 24);
      
      // 如果距离上次备份超过7天，创建新备份
      if (daysSinceLastBackup < 7) {
        return { success: true, skipped: true, reason: '距离上次备份不足7天' };
      }
    }
    
    // 创建自动备份
    const result = await createBackup('auto_backup');
    return result;
  } catch (error) {
    console.error('自动备份失败:', error);
    return { success: false, error: error.message };
  }
};

export default {
  initBackupDirectory,
  createBackup,
  getBackupList,
  shareBackup,
  deleteBackup,
  restoreFromBackup,
  importBackupFromFile,
  exportToCSV,
  autoBackup,
};
