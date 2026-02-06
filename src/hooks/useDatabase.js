import { useState, useEffect, useCallback } from 'react';
import { getDatabase, resetDatabase } from '../config/database';

/**
 * 数据库连接Hook
 * 用于管理数据库连接状态
 */
export const useDatabase = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await getDatabase();
        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error('数据库初始化失败:', err);
        setError(err.message);
        setIsReady(false);
      }
    };

    initDatabase();
  }, []);

  const reset = useCallback(async () => {
    try {
      await resetDatabase();
      setIsReady(false);
      // 重新初始化
      await getDatabase();
      setIsReady(true);
      return true;
    } catch (err) {
      console.error('重置数据库失败:', err);
      setError(err.message);
      return false;
    }
  }, []);

  return { isReady, error, reset };
};

export default useDatabase;
