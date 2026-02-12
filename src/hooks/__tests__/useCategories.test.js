// Test file for useCategories hook
import useCategories from '../useCategories';

// Mock repository
jest.mock('../../repositories/CategoryRepository', () => {
  return {
    getAll: jest.fn(),
    getByType: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getNextOrderIndex: jest.fn(),
    isInUse: jest.fn(),
    updateOrder: jest.fn(),
    findByName: jest.fn(),
    initializeDefaultCategoriesForUser: jest.fn(),
  };
});

describe('useCategories', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should be defined', () => {
    expect(useCategories).toBeDefined();
  });

  test('should be a function', () => {
    expect(typeof useCategories).toBe('function');
  });
});