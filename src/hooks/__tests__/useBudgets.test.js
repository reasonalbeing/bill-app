// Test file for useBudgets hook
import useBudgets from '../useBudgets';

// Mock repositories
jest.mock('../../repositories/BudgetRepository', () => {
  return {
    getByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
});

jest.mock('../../repositories/TransactionRepository', () => {
  return {
    getByUserId: jest.fn(),
  };
});

describe('useBudgets', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should be defined', () => {
    expect(useBudgets).toBeDefined();
  });

  test('should be a function', () => {
    expect(typeof useBudgets).toBe('function');
  });
});