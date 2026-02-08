// Test configuration files structure

describe('Configuration', () => {
  test('database config file should exist', () => {
    expect(() => {
      // Just test if the file exists, don't require it due to expo-sqlite dependency
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'database.js');
      expect(fs.existsSync(filePath)).toBe(true);
    }).not.toThrow();
  });

  test('firebase config file should exist', () => {
    expect(() => {
      // Just test if the file exists, don't require it due to firebase dependency
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'firebase.js');
      expect(fs.existsSync(filePath)).toBe(true);
    }).not.toThrow();
  });
});
