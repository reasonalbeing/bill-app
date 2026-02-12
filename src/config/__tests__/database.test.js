// Test database configuration and functionality

const fs = require('fs');
const path = require('path');

// Mock expo-sqlite
const mockCloseAsync = jest.fn();
const mockExecAsync = jest.fn();
const mockGetFirstAsync = jest.fn(() => Promise.resolve(null));
const mockRunAsync = jest.fn();

const mockSQLite = {
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: mockExecAsync,
    getFirstAsync: mockGetFirstAsync,
    runAsync: mockRunAsync,
    closeAsync: mockCloseAsync
  })),
  deleteDatabaseAsync: jest.fn(() => Promise.resolve())
};

jest.mock('expo-sqlite', () => mockSQLite);

// Clear module cache to ensure fresh import
jest.resetModules();

const { getDatabase, resetDatabase } = require('../database');
const SQLite = require('expo-sqlite');

describe('Database Configuration', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('should exist as a file', () => {
    const filePath = path.join(__dirname, '..', 'database.js');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('should export required functions', () => {
    const filePath = path.join(__dirname, '..', 'database.js');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('export const getDatabase');
    expect(content).toContain('export const resetDatabase');
    expect(content).toContain('export default');
  });

  test('should have database version configuration', () => {
    const filePath = path.join(__dirname, '..', 'database.js');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('DATABASE_VERSION');
    expect(content).toContain('DATABASE_NAME');
  });

  test('should have database initialization logic', () => {
    const filePath = path.join(__dirname, '..', 'database.js');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('initializeDatabase');
    expect(content).toContain('runMigrations');
    expect(content).toContain('migrateToV1');
  });

  test('should create required tables', () => {
    const filePath = path.join(__dirname, '..', 'database.js');
    const content = fs.readFileSync(filePath, 'utf8');
    
    const tables = [
      'users',
      'categories',
      'transactions',
      'budgets',
      'currencies',
      'settings',
      'ai_rules'
    ];
    
    tables.forEach(table => {
      expect(content).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    });
  });

  test('should create indexes for performance', () => {
    const filePath = path.join(__dirname, '..', 'database.js');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('CREATE INDEX IF NOT EXISTS');
  });

  test('should insert default data', () => {
    const filePath = path.join(__dirname, '..', 'database.js');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('insertDefaultCurrencies');
    expect(content).toContain('insertDefaultCategories');
  });

  test('should handle database reset', () => {
    const filePath = path.join(__dirname, '..', 'database.js');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('resetDatabase');
    expect(content).toContain('deleteDatabaseAsync');
  });

  test('getDatabase should return database instance', async () => {
    // Clear module cache to ensure fresh import
    jest.resetModules();
    
    // Re-import after resetting cache
    const { getDatabase } = require('../database');
    const SQLite = require('expo-sqlite');
    
    const db = await getDatabase();
    expect(db).toBeDefined();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('billApp.db');
  });

  test('getDatabase should return existing instance if already initialized', async () => {
    // Clear module cache to ensure fresh import
    jest.resetModules();
    
    // Re-import after resetting cache
    const { getDatabase } = require('../database');
    const SQLite = require('expo-sqlite');
    
    // First call should initialize
    const db1 = await getDatabase();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    
    // Second call should return existing instance
    const db2 = await getDatabase();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    expect(db1).toBe(db2);
  });

  test('resetDatabase should close and delete database', async () => {
    // Clear module cache to ensure fresh import
    jest.resetModules();
    
    // Re-import after resetting cache
    const { getDatabase, resetDatabase } = require('../database');
    const SQLite = require('expo-sqlite');
    
    // Initialize database first
    await getDatabase();
    
    // Reset database
    await resetDatabase();
    
    expect(mockCloseAsync).toHaveBeenCalled();
    expect(SQLite.deleteDatabaseAsync).toHaveBeenCalledWith('billApp.db');
  });
});
