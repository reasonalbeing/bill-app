/**
 * 数据同步服务
 * 用于管理本地SQLite数据与Firebase云端的同步
 */

import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firebase';
import Database from '../database/database';

const db = getFirestore(app);
const auth = getAuth(app);

// 同步状态
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
  CONFLICT: 'conflict',
};

// 最后同步时间存储键
const LAST_SYNC_KEY = 'last_sync_time';

/**
 * 获取当前用户ID
 */
const getCurrentUserId = () => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

/**
 * 保存最后同步时间
 */
const saveLastSyncTime = async () => {
  try {
    const now = new Date().toISOString();
    await Database.executeSql(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      [LAST_SYNC_KEY, now, now]
    );
    return now;
  } catch (error) {
    console.error('保存同步时间失败:', error);
    return null;
  }
};

/**
 * 获取最后同步时间
 */
export const getLastSyncTime = async () => {
  try {
    const result = await Database.executeSql(
      'SELECT value FROM settings WHERE key = ?',
      [LAST_SYNC_KEY]
    );
    return result.rows.length > 0 ? result.rows.item(0).value : null;
  } catch (error) {
    console.error('获取同步时间失败:', error);
    return null;
  }
};

/**
 * 同步用户数据到云端
 */
export const syncToCloud = async (onProgress) => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('用户未登录');
  }

  try {
    // 同步分类数据
    await syncCategoriesToCloud(userId, onProgress);
    
    // 同步账单数据
    await syncTransactionsToCloud(userId, onProgress);
    
    // 同步预算数据
    await syncBudgetsToCloud(userId, onProgress);
    
    // 保存同步时间
    await saveLastSyncTime();
    
    return { success: true, message: '同步到云端成功' };
  } catch (error) {
    console.error('同步到云端失败:', error);
    throw error;
  }
};

/**
 * 从云端同步数据到本地
 */
export const syncFromCloud = async (onProgress) => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('用户未登录');
  }

  try {
    // 同步分类数据
    await syncCategoriesFromCloud(userId, onProgress);
    
    // 同步账单数据
    await syncTransactionsFromCloud(userId, onProgress);
    
    // 同步预算数据
    await syncBudgetsFromCloud(userId, onProgress);
    
    // 保存同步时间
    await saveLastSyncTime();
    
    return { success: true, message: '从云端同步成功' };
  } catch (error) {
    console.error('从云端同步失败:', error);
    throw error;
  }
};

/**
 * 双向同步（合并本地和云端数据）
 */
export const syncBidirectional = async (onProgress) => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('用户未登录');
  }

  try {
    // 先上传本地数据到云端
    await syncToCloud(onProgress);
    
    // 再从云端下载数据
    await syncFromCloud(onProgress);
    
    return { success: true, message: '双向同步成功' };
  } catch (error) {
    console.error('双向同步失败:', error);
    throw error;
  }
};

/**
 * 同步分类到云端
 */
const syncCategoriesToCloud = async (userId, onProgress) => {
  try {
    const result = await Database.executeSql(
      'SELECT * FROM categories WHERE user_id = ? OR is_default = 1',
      [userId]
    );

    const batch = writeBatch(db);
    const categoriesRef = collection(db, 'users', userId, 'categories');

    for (let i = 0; i < result.rows.length