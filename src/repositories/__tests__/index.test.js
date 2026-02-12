/**
 * Test file for repositories/index.js
 * Tests that all repositories are correctly exported
 */

// Import the module to execute all code
import * as repositories from '../index';
import defaultRepositories from '../index';

describe('repositories/index.js', () => {
  describe('Named exports', () => {
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
  });

  describe('Default export', () => {
    test('should have default export with repository instances', () => {
      expect(defaultRepositories).toBeDefined();
      expect(typeof defaultRepositories).toBe('object');
    });

    test('should have transactions repository instance', () => {
      expect(defaultRepositories.transactions).toBeDefined();
      expect(defaultRepositories.transactions).toBe(repositories.TransactionRepository);
    });

    test('should have categories repository instance', () => {
      expect(defaultRepositories.categories).toBeDefined();
      expect(defaultRepositories.categories).toBe(repositories.CategoryRepository);
    });

    test('should have budgets repository instance', () => {
      expect(defaultRepositories.budgets).toBeDefined();
      expect(defaultRepositories.budgets).toBe(repositories.BudgetRepository);
    });
  });

  describe('Module structure', () => {
    test('should have all required named exports', () => {
      const exportedKeys = Object.keys(repositories);
      expect(exportedKeys).toContain('BaseRepository');
      expect(exportedKeys).toContain('TransactionRepository');
      expect(exportedKeys).toContain('CategoryRepository');
      expect(exportedKeys).toContain('BudgetRepository');
    });

    test('should export exactly 4 named exports', () => {
      const exportedKeys = Object.keys(repositories);
      expect(exportedKeys.length).toBe(5); // 4 named exports + 1 default
    });

    test('default export should have exactly 3 properties', () => {
      const defaultKeys = Object.keys(defaultRepositories);
      expect(defaultKeys.length).toBe(3);
      expect(defaultKeys).toContain('transactions');
      expect(defaultKeys).toContain('categories');
      expect(defaultKeys).toContain('budgets');
    });
  });
});
