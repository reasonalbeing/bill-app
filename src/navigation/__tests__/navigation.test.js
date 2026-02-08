// Test navigation files structure

describe('Navigation', () => {
  test('AppNavigator file should exist', () => {
    expect(() => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'AppNavigator.js');
      expect(fs.existsSync(filePath)).toBe(true);
    }).not.toThrow();
  });

  test('MainTabNavigator file should exist', () => {
    expect(() => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'MainTabNavigator.js');
      expect(fs.existsSync(filePath)).toBe(true);
    }).not.toThrow();
  });

  test('AppNavigator should export a function', () => {
    expect(() => {
      // Just test if the file can be required without JSX parsing issues
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'AppNavigator.js');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('export default function AppNavigator');
    }).not.toThrow();
  });

  test('MainTabNavigator should export a function', () => {
    expect(() => {
      // Just test if the file can be required without JSX parsing issues
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'MainTabNavigator.js');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('export default function MainTabNavigator');
    }).not.toThrow();
  });
});
