/**
 * Repository导出文件
 * 集中导出所有Repository，方便其他模块引用
 */

export { default as BaseRepository } from './BaseRepository';
export { default as TransactionRepository } from './TransactionRepository';
export { default as CategoryRepository } from './CategoryRepository';
export { default as BudgetRepository } from './BudgetRepository';

// 默认导出所有Repository实例
import TransactionRepository from './TransactionRepository';
import CategoryRepository from './CategoryRepository';
import BudgetRepository from './BudgetRepository';

export default {
  transactions: TransactionRepository,
  categories: CategoryRepository,
  budgets: BudgetRepository,
};
