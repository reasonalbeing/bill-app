// Mock dependencies
jest.mock('../../config/database');

// Import dependencies
import { renderHook, act } from '@testing-library/react-native';
import useDatabase from '../useDatabase';
import { getDatabase, resetDatabase } from '../../config/database';

describe('useDatabase Hook', () => {
  let mockDatabase;
  let mockGetDatabase;
  let mockResetDatabase;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDatabase = {
      executeSql: jest.fn(),
      transaction: jest.fn(),
    };
    
    mockGetDatabase = jest.fn(() => mockDatabase);
    mockResetDatabase = jest.fn(() => Promise.resolve());
    
    getDatabase.mockImplementation(mockGetDatabase);
    resetDatabase.mockImplementation(mockResetDatabase);
  });

  describe('Initialization', () => {
    it('should initialize database on mount', async () => {
      const { result } = renderHook(() => useDatabase());

      expect(result.current.isReady).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle initialization error', async () => {
      const mockError = new Error('Failed to initialize database');
      mockGetDatabase.mockImplementation(() => {
        throw mockError;
      });

      const { result } = renderHook(() => useDatabase());

      expect(result.current.isReady).toBe(false);
      expect(result.current.error).toBe('Failed to initialize database');
    });
  });

  describe('Database Operations', () => {
    it('should reset database', async () => {
      const { result } = renderHook(() => useDatabase());

      let resetResult;
      await act(async () => {
        resetResult = await result.current.reset();
      });

      expect(resetResult).toBe(true);
      expect(mockResetDatabase).toHaveBeenCalled();
    });

    it('should handle reset database error', async () => {
      const mockError = new Error('Failed to reset database');
      mockResetDatabase.mockRejectedValue(mockError);

      const { result } = renderHook(() => useDatabase());

      let resetResult;
      await act(async () => {
        resetResult = await result.current.reset();
      });

      expect(resetResult).toBe(false);
      expect(mockResetDatabase).toHaveBeenCalled();
    });
  });
});
