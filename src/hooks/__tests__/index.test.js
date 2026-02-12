/**
 * Test file for hooks/index.js
 * Tests that all hooks are correctly exported
 */

import * as hooks from '../index';

describe('hooks/index.js', () => {
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