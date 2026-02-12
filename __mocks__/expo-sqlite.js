// Mock for expo-sqlite module
module.exports = {
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn(),
    executeSql: jest.fn(),
    closeAsync: jest.fn(),
  }),
  deleteDatabaseAsync: jest.fn(),
};
