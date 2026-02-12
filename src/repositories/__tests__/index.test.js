/**
 * Test file for repositories/index.js
 * Tests that all repositories are correctly exported
 */

import * as repositories from '../index';
import defaultRepositories from '../index';

describe('repositories/index.js', () => {
  test('should export BaseRepository', () => {
    expect(repositories.BaseRepository).toBeDefined();
    expect(typeof repositories.BaseRepository).toBe('function');
  });

  test('should export TransactionRepository', () => {
    expect(repositories.TransactionRepository).toBeDefined();
    expect(typeof repositories.TransactionRepository).toBe('object');
  });

  test('should export CategoryRepository', () => {
    expect(repositories.CategoryRepository).toBeDefined();
    expect(typeof repositories.CategoryRepository).toBe('object');
  });

  test('should export BudgetRepository', () => {
    expect(repositories.BudgetRepository).toBeDefined();
    expect(typeof repositories.BudgetRepository).toBe('object');
  });

  test('should have default export with repository instances', () => {
    expect(defaultRepositories).toBeDefined();
    expect(defaultRepositories).toHaveProperty('transactions');
    expect(defaultRepositories).toHaveProperty('categories');
    expect(defaultRepositories).toHaveProperty('budgets');
  });

  test('should have transactions repository instance', () => {
    expect(defaultRepositories.transactions).toBeDefined();
  });

  test('should have categories repository instance', () => {
    expect(defaultRepositories.categories).toBeDefined();
  });

  test('should have budgets repository instance', () => {
    expect(defaultRepositories.budgets).toBeDefined();
  });
});