// Test navigation files structure and functionality
const fs = require('fs');
const path = require('path');

describe('Navigation', () => {
  describe('Navigation files existence', () => {
    test('AppNavigator file should exist', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'AppNavigator.js');
        expect(fs.existsSync(filePath)).toBe(true);
      }).not.toThrow();
    });

    test('MainTabNavigator file should exist', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'MainTabNavigator.js');
        expect(fs.existsSync(filePath)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('Navigation files structure', () => {
    test('AppNavigator should export a component', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'AppNavigator.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('export default');
      }).not.toThrow();
    });

    test('MainTabNavigator should export a component', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'MainTabNavigator.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('export default');
      }).not.toThrow();
    });

    test('AppNavigator should contain required navigation setup', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'AppNavigator.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('NavigationContainer');
        expect(content).toContain('createNativeStackNavigator');
        expect(content).toContain('Stack.Navigator');
      }).not.toThrow();
    });

    test('MainTabNavigator should contain required tab setup', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'MainTabNavigator.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('createBottomTabNavigator');
        expect(content).toContain('Tab.Navigator');
        expect(content).toContain('tabBarActiveTintColor');
      }).not.toThrow();
    });
  });

  describe('Navigation configuration', () => {
    test('AppNavigator should define screen options', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'AppNavigator.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('screenOptions');
        expect(content).toContain('headerShown');
      }).not.toThrow();
    });

    test('MainTabNavigator should define tab options', () => {
      expect(() => {
        const filePath = path.join(__dirname, '..', 'MainTabNavigator.js');
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain('screenOptions');
        expect(content).toContain('headerShown');
        expect(content).toContain('tabBarActiveTintColor');
        expect(content).toContain('tabBarInactiveTintColor');
      }).not.toThrow();
    });
  });
});
