// Test hooks file structure and basic functionality

const fs = require('fs');
const path = require('path');

describe('hooks', () => {
  describe('File Structure', () => {
    test('hooks directory should exist', () => {
      const hooksDir = path.join(__dirname, '..');
      expect(fs.existsSync(hooksDir)).toBe(true);
      expect(fs.statSync(hooksDir).isDirectory()).toBe(true);
    });

    test('index.js should exist', () => {
      const filePath = path.join(__dirname, '..', 'index.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('useBudgets.js should exist', () => {
      const filePath = path.join(__dirname, '..', 'useBudgets.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('useCategories.js should exist', () => {
      const filePath = path.join(__dirname, '..', 'useCategories.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('useDatabase.js should exist', () => {
      const filePath = path.join(__dirname, '..', 'useDatabase.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('useTransactions.js should exist', () => {
      const filePath = path.join(__dirname, '..', 'useTransactions.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Module Exports', () => {
    test('index.js should export all hooks', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'index.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('export { default as useBudgets }');
        expect(content).toContain('export { default as useCategories }');
        expect(content).toContain('export { default as useDatabase }');
        expect(content).toContain('export { default as useTransactions }');
      }).not.toThrow();
    });

    test('useBudgets should be exportable', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'useBudgets.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('export default');
      }).not.toThrow();
    });

    test('useCategories should be exportable', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'useCategories.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('export default');
      }).not.toThrow();
    });

    test('useDatabase should be exportable', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'useDatabase.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('export default');
      }).not.toThrow();
    });

    test('useTransactions should be exportable', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'useTransactions.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('export default');
      }).not.toThrow();
    });
  });

  describe('File Content Structure', () => {
    test('useBudgets.js should have basic structure', () => {
      const filePath = path.join(__dirname, '..', 'useBudgets.js');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('export const useBudgets');
      expect(content).toContain('useState');
      expect(content).toContain('useEffect');
      expect(content).toContain('createBudget');
      expect(content).toContain('updateBudget');
      expect(content).toContain('deleteBudget');
      expect(content).toContain('transferSurplus');
    });

    test('useCategories.js should have basic structure', () => {
      const filePath = path.join(__dirname, '..', 'useCategories.js');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('export const useCategories');
      expect(content).toContain('useState');
      expect(content).toContain('useEffect');
      expect(content).toContain('createCategory');
      expect(content).toContain('updateCategory');
      expect(content).toContain('deleteCategory');
    });

    test('useDatabase.js should have basic structure', () => {
      const filePath = path.join(__dirname, '..', 'useDatabase.js');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('export const useDatabase');
      expect(content).toContain('useState');
      expect(content).toContain('useEffect');
      expect(content).toContain('getDatabase');
    });

    test('useTransactions.js should have basic structure', () => {
      const filePath = path.join(__dirname, '..', 'useTransactions.js');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('export const useTransactions');
      expect(content).toContain('useState');
      expect(content).toContain('useEffect');
      expect(content).toContain('createTransaction');
      expect(content).toContain('updateTransaction');
      expect(content).toContain('deleteTransaction');
      expect(content).toContain('importTransactions');
    });

    test('index.js should export all hooks', () => {
      const filePath = path.join(__dirname, '..', 'index.js');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('export { default as useBudgets }');
      expect(content).toContain('export { default as useCategories }');
      expect(content).toContain('export { default as useDatabase }');
      expect(content).toContain('export { default as useTransactions }');
    });
  });
});
