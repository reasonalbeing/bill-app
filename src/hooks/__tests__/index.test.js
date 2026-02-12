/**
 * Test file for hooks/index.js
 * Tests that all hooks are correctly exported
 */

// Import the module to execute all code
import * as hooks from '../index';
import defaultExport from '../index';

describe('hooks/index.js', () => {
  describe('Named exports', () => {
    test('should export useDatabase', () => {
      expect(hooks.useDatabase).toBeDefined();
      expect(typeof hooks.useDatabase).toBe('function');
    });

    test('should export useTransactions', () => {
      expect(hooks.useTransactions).toBeDefined();
      expect(typeof hooks.useTransactions).toBe('function');
    });

    test('should export useCategories', () => {
      expect(hooks.useCategories).toBeDefined();
      expect(typeof hooks.useCategories).toBe('function');
    });

    test('should export useBudgets', () => {
      expect(hooks.useBudgets).toBeDefined();
      expect(typeof hooks.useBudgets).toBe('function');
    });
  });

  describe('Module structure', () => {
    test('should have all required exports', () => {
      const exportedKeys = Object.keys(hooks);
      expect(exportedKeys).toContain('useDatabase');
      expect(exportedKeys).toContain('useTransactions');
      expect(exportedKeys).toContain('useCategories');
      expect(exportedKeys).toContain('useBudgets');
    });

    test('should export exactly 4 hooks', () => {
      const exportedKeys = Object.keys(hooks);
      expect(exportedKeys.length).toBe(4);
    });
  });
});
