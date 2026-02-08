// StatisticsScreen 基础测试

describe('StatisticsScreen', () => {
  test('should exist', () => {
    expect(() => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'StatisticsScreen.js');
      expect(fs.existsSync(filePath)).toBe(true);
    }).not.toThrow();
  });

  test('should export a component', () => {
    expect(() => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'StatisticsScreen.js');
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('export default');
    }).not.toThrow();
  });
});
